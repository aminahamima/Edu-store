<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\Produit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockController extends Controller
{
    // GET /api/stocks
    public function index(Request $request): JsonResponse
    {
        $query = Stock::with('produit');

        if ($request->boolean('alerte')) {
            $query->whereColumn('quantite_disponible', '<=', 'seuil_alerte');
        }

        $stocks = $query->paginate($request->get('per_page', 15));

        return response()->json($stocks);
    }

    // POST /api/stocks
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'produit_id'          => 'required|exists:produits,id|unique:stocks,produit_id',
            'quantite_disponible' => 'required|integer|min:0',
            'seuil_alerte'        => 'integer|min:0',
        ]);

        $stock = Stock::create($data + ['date_mise_a_jour' => now()->toDateString()]);

        return response()->json([
            'message' => 'Stock créé.',
            'stock'   => $stock->load('produit'),
        ], 201);
    }

    // GET /api/stocks/{id}
    public function show(Stock $stock): JsonResponse
    {
        return response()->json($stock->load('produit'));
    }

    // PUT /api/stocks/{id}
    public function update(Request $request, Stock $stock): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'quantite_disponible' => 'sometimes|integer|min:0',
            'seuil_alerte'        => 'sometimes|integer|min:0',
        ]);

        $stock->mettreAJour($data['quantite_disponible'] ?? $stock->quantite_disponible);

        if (isset($data['seuil_alerte'])) {
            $stock->update(['seuil_alerte' => $data['seuil_alerte']]);
        }

        $stock->envoyerAlerte();

        return response()->json([
            'message'         => 'Stock mis à jour.',
            'stock'           => $stock->fresh('produit'),
            'alerte_active'   => $stock->verifierSeuil(),
        ]);
    }

    // DELETE /api/stocks/{id}
    public function destroy(Request $request, Stock $stock): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $stock->delete();

        return response()->json(['message' => 'Stock supprimé.']);
    }
}
