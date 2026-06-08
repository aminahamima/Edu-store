<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProduitController extends Controller
{
    // GET /api/produits
    public function index(Request $request): JsonResponse
    {
        $query = Produit::with('categorie', 'stock');

        if ($request->filled('categorie_id')) {
            $query->where('categorie_id', $request->categorie_id);
        }

        if ($request->filled('disponible')) {
            $query->where('disponible', filter_var($request->disponible, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $query->where('nom', 'like', '%' . $request->search . '%');
        }

        $produits = $query->paginate($request->get('per_page', 15));

        return response()->json($produits);
    }

    // POST /api/produits
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'nom'          => 'required|string|max:255',
            'description'  => 'nullable|string',
            'prix'         => 'required|numeric|min:0',
            'image'        => 'nullable|string|max:255',
            'images'       => 'nullable|array',
            'images.*'     => 'nullable|url|max:500',
            'promo_image'  => 'nullable|url|max:500',
            'niveau_scolaire' => 'nullable|string|max:100',
            'langue'       => 'nullable|string|max:50',
            'disponible'   => 'boolean',
            'categorie_id' => 'required|exists:categories,id',
            'quantite_disponible' => 'nullable|integer|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
        ]);

        // Compat: si images[] fourni, on synchronise `image` sur la première pour l'app existante
        if (!empty($data['images']) && empty($data['image'])) {
            $first = collect($data['images'])->filter()->first();
            if ($first) $data['image'] = $first;
        }

        $stockData = [
            'quantite_disponible' => $data['quantite_disponible'] ?? 0,
            'seuil_alerte' => $data['seuil_alerte'] ?? 5,
            'date_mise_a_jour' => now()->toDateString(),
        ];
        unset($data['quantite_disponible'], $data['seuil_alerte']);

        $produit = Produit::create($data);
        $produit->stock()->updateOrCreate(['produit_id' => $produit->id], $stockData);

        return response()->json([
            'message' => 'Produit créé avec succès.',
            'produit' => $produit->load('categorie', 'stock'),
        ], 201);
    }

    // GET /api/produits/{id}
    public function show(Produit $produit): JsonResponse
    {
        return response()->json($produit->load('categorie', 'stock'));
    }

    // PUT /api/produits/{id}
    public function update(Request $request, Produit $produit): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'nom'          => 'sometimes|string|max:255',
            'description'  => 'nullable|string',
            'prix'         => 'sometimes|numeric|min:0',
            'image'        => 'nullable|string|max:255',
            'images'       => 'nullable|array',
            'images.*'     => 'nullable|url|max:500',
            'promo_image'  => 'nullable|url|max:500',
            'niveau_scolaire' => 'nullable|string|max:100',
            'langue'       => 'nullable|string|max:50',
            'disponible'   => 'boolean',
            'categorie_id' => 'nullable|exists:categories,id',
            'quantite_disponible' => 'nullable|integer|min:0',
            'seuil_alerte' => 'nullable|integer|min:0',
        ]);

        if (array_key_exists('images', $data) && empty($data['image'])) {
            $first = collect($data['images'] ?? [])->filter()->first();
            if ($first) $data['image'] = $first;
        }

        $stockPatch = [];
        if (array_key_exists('quantite_disponible', $data)) {
            $stockPatch['quantite_disponible'] = $data['quantite_disponible'];
            unset($data['quantite_disponible']);
        }
        if (array_key_exists('seuil_alerte', $data)) {
            $stockPatch['seuil_alerte'] = $data['seuil_alerte'];
            unset($data['seuil_alerte']);
        }

        $produit->update($data);
        if ($stockPatch) {
            $stockPatch['date_mise_a_jour'] = now()->toDateString();
            $produit->stock()->updateOrCreate(['produit_id' => $produit->id], $stockPatch);
        }

        return response()->json([
            'message' => 'Produit mis à jour.',
            'produit' => $produit->fresh('categorie', 'stock'),
        ]);
    }

    // DELETE /api/produits/{id}
    public function destroy(Request $request, Produit $produit): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $produit->delete();

        return response()->json(['message' => 'Produit supprimé.']);
    }
}
