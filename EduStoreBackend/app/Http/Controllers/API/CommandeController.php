<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Commande;
use App\Models\LigneCommande;
use App\Models\Panier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CommandeController extends Controller
{
    // GET /api/commandes
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            $query = Commande::with('client.utilisateur', 'lignes.produit', 'paiement', 'facture');
        } else {
            $client = $user->getOrCreateClient();
            if (! $client) {
                return response()->json(['message' => 'Profil client introuvable.'], 403);
            }
            $query = $client->commandes()->with('lignes.produit', 'paiement', 'facture');
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        $commandes = $query->latest()->paginate($request->get('per_page', 10));

        return response()->json($commandes);
    }

    // POST /api/commandes
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'panier_id'         => 'required|exists:paniers,id',
            'adresse_livraison' => 'required|string|max:255',
            'telephone_livraison' => 'required|string|max:20',
            'mode_paiement'     => 'required|in:livraison,cash_on_delivery,card,paypal',
        ]);

        // Map frontend payment methods to database values
        $modePaiementMap = [
            'cash_on_delivery' => 'livraison',
            'card' => 'livraison',
            'paypal' => 'livraison',
            'livraison' => 'livraison',
        ];
        
        $data['mode_paiement'] = $modePaiementMap[$data['mode_paiement']] ?? 'livraison';

        $user = $request->user();
        $client = $user->getOrCreateClient();
        if (! $client) {
            return response()->json(['message' => 'Les administrateurs ne peuvent pas passer commande en tant que client.'], 403);
        }

        $panier = Panier::with('lignes.produit')->findOrFail($data['panier_id']);

        if ((int) $panier->utilisateur_id !== (int) $client->id) {
            return response()->json(['message' => 'Ce panier ne vous appartient pas.'], 403);
        }

        if ($panier->lignes->isEmpty()) {
            return response()->json(['message' => 'Le panier est vide.'], 422);
        }

        // Create order
        $commande = $client->commandes()->create([
            'statut'            => 'en_attente',
            'montant_total'     => $panier->calculerTotal(),
            'adresse_livraison' => $data['adresse_livraison'],
            'telephone_livraison' => $data['telephone_livraison'],
            'mode_paiement'     => $data['mode_paiement'],
        ]);

        // Copy lines from cart
        foreach ($panier->lignes as $ligne) {
            LigneCommande::create([
                'commande_id'  => $commande->id,
                'produit_id'   => $ligne->produit_id,
                'quantite'     => $ligne->quantite,
                'prix_unitaire'=> $ligne->prix_unitaire,
                'sous_total'   => $ligne->quantite * $ligne->prix_unitaire,
            ]);

            // Decrease stock
            $ligne->produit->mettreAJourStock(
                max(0, $ligne->produit->stock->quantite_disponible - $ligne->quantite)
            );
        }

        // Clear cart
        $panier->vider();
        $panier->update(['statut' => 'converti']);

        return response()->json([
            'message'  => 'Commande passée avec succès.',
            'commande' => $commande->load('lignes.produit'),
        ], 201);
    }

    // GET /api/commandes/{id}
    public function show(Request $request, Commande $commande): JsonResponse
    {
        $user = $request->user();

        $client = $user->getOrCreateClient();
        if (! $user->isAdmin() && (! $client || (int) $commande->client_id !== (int) $client->id)) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        return response()->json(
            $commande->load('client.utilisateur', 'lignes.produit', 'paiement', 'facture')
        );
    }

    // PUT /api/commandes/{id}
    public function update(Request $request, Commande $commande): JsonResponse
    {
        $user = $request->user();
        $client = $user->getOrCreateClient();
        if (! $user->isAdmin() && (! $client || (int) $commande->client_id !== (int) $client->id)) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'statut' => 'required|in:en_attente,confirmee,en_livraison,livree,annulee',
        ]);

        $commande->mettreAJourStatut($data['statut']);

        return response()->json([
            'message'  => 'Statut mis à jour.',
            'commande' => $commande->fresh(),
        ]);
    }

    // DELETE /api/commandes/{id}
    public function destroy(Request $request, Commande $commande): JsonResponse
    {
        $user = $request->user();
        $client = $user->getOrCreateClient();
        if (! $user->isAdmin() && (! $client || (int) $commande->client_id !== (int) $client->id)) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (! in_array($commande->statut, ['en_attente', 'annulee'])) {
            return response()->json(['message' => 'Impossible d\'annuler une commande en cours.'], 422);
        }

        $commande->annuler();

        return response()->json(['message' => 'Commande annulée.']);
    }
}
