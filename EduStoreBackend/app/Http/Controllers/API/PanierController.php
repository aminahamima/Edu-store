<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Panier;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PanierController extends Controller
{
    private function clientOrForbidden(Request $request): JsonResponse|Client
    {
        $client = $request->user()->getOrCreateClient();
        if (! $client) {
            return response()->json(['message' => 'Action réservée aux comptes clients.'], 403);
        }

        return $client;
    }

    // GET /api/panier
    public function index(Request $request): JsonResponse
    {
        $client = $this->clientOrForbidden($request);
        if ($client instanceof JsonResponse) {
            return $client;
        }

        $panier = $client
            ->paniers()
            ->with('lignes.produit')
            ->where('statut', 'actif')
            ->latest()
            ->first();

        if (! $panier) {
            return response()->json(['message' => 'Aucun panier actif.', 'panier' => null]);
        }

        return response()->json([
            'panier' => $panier,
            'total'  => $panier->calculerTotal(),
        ]);
    }

    // POST /api/panier
    public function store(Request $request): JsonResponse
    {
        $client = $this->clientOrForbidden($request);
        if ($client instanceof JsonResponse) {
            return $client;
        }

        // Check if user already has an active panier
        $existingPanier = $client
            ->paniers()
            ->where('statut', 'actif')
            ->first();

        if ($existingPanier) {
            return response()->json([
                'message' => 'Panier actif déjà existant.',
                'panier'  => $existingPanier,
            ], 200);
        }

        $panier = $client->paniers()->create([
            'statut' => 'actif',
        ]);

        return response()->json([
            'message' => 'Panier créé.',
            'panier'  => $panier,
        ], 201);
    }

    // GET /api/panier/{id}
    public function show(Request $request, Panier $panier): JsonResponse
    {
        $client = $this->clientOrForbidden($request);
        if ($client instanceof JsonResponse) {
            return $client;
        }

        if ($panier->utilisateur_id !== $client->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        return response()->json([
            'panier' => $panier->load('lignes.produit'),
            'total'  => $panier->calculerTotal(),
        ]);
    }

    // POST /api/panier/{id}/ajouter
    public function ajouterProduit(Request $request, Panier $panier): JsonResponse
    {
        $client = $this->clientOrForbidden($request);
        if ($client instanceof JsonResponse) {
            return $client;
        }

        if ($panier->utilisateur_id !== $client->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'produit_id' => 'required|exists:produits,id',
            'quantite'   => 'integer|min:1',
        ]);

        $produit = Produit::findOrFail($data['produit_id']);

        if (! $produit->verifierStock()) {
            return response()->json(['message' => 'Produit en rupture de stock.'], 422);
        }

        $ligne = $panier->ajouterProduit($produit, $data['quantite'] ?? 1);

        return response()->json([
            'message' => 'Produit ajouté au panier.',
            'ligne'   => $ligne->load('produit'),
            'total'   => $panier->calculerTotal(),
        ]);
    }

    // DELETE /api/panier/{id}/supprimer/{produit}
    public function supprimerProduit(Request $request, Panier $panier, Produit $produit): JsonResponse
    {
        $client = $this->clientOrForbidden($request);
        if ($client instanceof JsonResponse) {
            return $client;
        }

        if ($panier->utilisateur_id !== $client->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $panier->supprimerProduit($produit);

        return response()->json([
            'message' => 'Produit retiré du panier.',
            'total'   => $panier->calculerTotal(),
        ]);
    }

    // DELETE /api/panier/{id}/vider
    public function update(Request $request, Panier $panier): JsonResponse
    {
        $client = $this->clientOrForbidden($request);
        if ($client instanceof JsonResponse) {
            return $client;
        }

        if ($panier->utilisateur_id !== $client->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $panier->vider();

        return response()->json(['message' => 'Panier vidé.']);
    }

    // DELETE /api/panier/{id}
    public function destroy(Request $request, Panier $panier): JsonResponse
    {
        $client = $this->clientOrForbidden($request);
        if ($client instanceof JsonResponse) {
            return $client;
        }

        if ($panier->utilisateur_id !== $client->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $panier->delete();

        return response()->json(['message' => 'Panier supprimé.']);
    }
}
