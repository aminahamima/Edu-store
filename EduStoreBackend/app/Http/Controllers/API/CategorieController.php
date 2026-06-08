<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Categorie;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategorieController extends Controller
{
    // GET /api/categories
    public function index(): JsonResponse
    {
        $categories = Categorie::withCount('produits')->get();

        return response()->json($categories);
    }

    // POST /api/categories
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'nom'         => 'required|string|max:100|unique:categories,nom',
            'description' => 'nullable|string',
        ]);

        $categorie = Categorie::create($data);

        return response()->json([
            'message'   => 'Catégorie créée avec succès.',
            'categorie' => $categorie,
        ], 201);
    }

    // GET /api/categories/{id}
    public function show(Categorie $categorie): JsonResponse
    {
        return response()->json($categorie->load('produits'));
    }

    // PUT /api/categories/{id}
    public function update(Request $request, Categorie $categorie): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'nom'         => 'sometimes|string|max:100|unique:categories,nom,' . $categorie->id,
            'description' => 'nullable|string',
        ]);

        $categorie->update($data);

        return response()->json([
            'message'   => 'Catégorie mise à jour.',
            'categorie' => $categorie->fresh(),
        ]);
    }

    // DELETE /api/categories/{id}
    public function destroy(Request $request, Categorie $categorie): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($categorie->produits()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer : des produits sont liés à cette catégorie.',
            ], 422);
        }

        $categorie->delete();

        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}
