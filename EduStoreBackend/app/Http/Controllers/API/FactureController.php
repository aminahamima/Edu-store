<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use App\Models\Commande;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FactureController extends Controller
{
    // GET /api/factures
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            $query = Facture::with('commande.client.utilisateur');
        } else {
            $client = $user->getOrCreateClient();
            if (! $client) {
                return response()->json(['message' => 'Profil client introuvable.'], 403);
            }
            $query = Facture::whereHas('commande', fn ($q) => $q->where('utilisateur_id', $client->id))->with('commande');
        }

        $factures = $query->latest()->paginate($request->get('per_page', 10));

        return response()->json($factures);
    }

    // POST /api/factures
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'commande_id' => 'required|exists:commandes,id|unique:factures,commande_id',
            'taux_tva'    => 'nullable|numeric|min:0|max:1',
        ]);

        $commande = Commande::findOrFail($data['commande_id']);

        if ($commande->statut !== 'livree') {
            return response()->json([
                'message' => 'Une facture ne peut être générée que pour une commande livrée.',
            ], 422);
        }

        $facture = Facture::creerPourCommande($commande, $data['taux_tva'] ?? 0.20);

        return response()->json([
            'message' => 'Facture générée avec succès.',
            'facture' => $facture->load('commande'),
        ], 201);
    }

    // GET /api/factures/{id}
    public function show(Request $request, Facture $facture): JsonResponse
    {
        $user = $request->user();

        $client = $user->getOrCreateClient();
        if (! $user->isAdmin() && (! $client || (int) $facture->commande->utilisateur_id !== (int) $client->id)) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        return response()->json(
            $facture->load('commande.lignes.produit', 'commande.client.utilisateur')
        );
    }

    // PUT /api/factures/{id} — admin only
    public function update(Request $request, Facture $facture): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'montant_ht'  => 'sometimes|numeric|min:0',
            'montant_ttc' => 'sometimes|numeric|min:0',
        ]);

        $facture->update($data);

        return response()->json([
            'message' => 'Facture mise à jour.',
            'facture' => $facture->fresh(),
        ]);
    }

    // DELETE /api/factures/{id}
    public function destroy(Request $request, Facture $facture): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $facture->delete();

        return response()->json(['message' => 'Facture supprimée.']);
    }

    // GET /api/factures/{id}/pdf
    public function telechargerPDF(Request $request, Facture $facture)
    {
        $user = $request->user();

        $client = $user->getOrCreateClient();
        if (! $user->isAdmin() && (! $client || (int) $facture->commande->utilisateur_id !== (int) $client->id)) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $path = $facture->genererPDF();

        if (! file_exists($path)) {
            // Generate a simple PDF if it doesn't exist
            $this->generateSimplePDF($facture, $path);
        }

        return response()->download($path, "Facture-{$facture->numero}.pdf");
    }

    private function generateSimplePDF(Facture $facture, string $path): void
    {
        $commande = $facture->commande->load('lignes.produit', 'client.utilisateur');
        $client = $commande->client->utilisateur;
        
        $content = "FACTURE #{$facture->numero}\n";
        $content .= "Date: {$facture->date_emission}\n";
        $content .= "Client: {$client->prenom} {$client->nom}\n";
        $content .= "Email: {$client->email}\n";
        $content .= "\nDétails de la commande:\n";
        $content .= "Montant HT: {$facture->montant_ht} DH\n";
        $content .= "Montant TTC: {$facture->montant_ttc} DH\n";
        $content .= "\nProduits:\n";
        
        foreach ($commande->lignes as $ligne) {
            $content .= "- {$ligne->produit->nom} x{$ligne->quantite}: {$ligne->prix_unitaire} DH\n";
        }
        
        // Ensure directory exists
        if (! file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }
        
        file_put_contents($path, $content);
    }
}
