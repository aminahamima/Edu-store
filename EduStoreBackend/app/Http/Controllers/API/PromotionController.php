<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PromotionController extends Controller
{
    // GET /api/promotions
    public function index(Request $request): JsonResponse
    {
        $query = Promotion::query();

        $all = $request->boolean('all');
        $isAdmin = $request->user()?->isAdmin();
        if (! ($all && $isAdmin)) {
            $today = now()->toDateString();

            $query->where('active', true)
                ->where(function ($q) use ($today) {
                    $q->whereNull('date_debut')->orWhereDate('date_debut', '<=', $today);
                })
                ->where(function ($q) use ($today) {
                    $q->whereNull('date_fin')->orWhereDate('date_fin', '>=', $today);
                });
        }

        $promotions = $query->latest()->paginate($request->get('per_page', 10));
        return response()->json($promotions);
    }

    public function show(Request $request, Promotion $promotion): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            abort_unless($promotion->active, 404);
        }

        return response()->json($promotion);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'titre'             => 'required|string|max:150',
            'description'       => 'nullable|string',
            'code_promo'       => 'nullable|string|max:80|unique:promotions,code_promo',
            'reduction_percent' => 'nullable|numeric|min:0|max:100',
            'reduction_montant' => 'nullable|numeric|min:0',
            'lien'              => 'nullable|string|max:255',
            'image_url'         => 'nullable|string|max:500',
            'date_debut'        => 'nullable|date',
            'date_fin'          => 'nullable|date|after_or_equal:date_debut',
            'active'            => 'boolean',
        ]);

        $promotion = Promotion::create($data);
        return response()->json(['message' => 'Promotion créée.', 'promotion' => $promotion], 201);
    }

    public function update(Request $request, Promotion $promotion): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'titre'             => 'sometimes|required|string|max:150',
            'description'       => 'sometimes|nullable|string',
            'code_promo'       => 'sometimes|nullable|string|max:80',
            'reduction_percent' => 'sometimes|nullable|numeric|min:0|max:100',
            'reduction_montant' => 'sometimes|nullable|numeric|min:0',
            'lien'              => 'sometimes|nullable|string|max:255',
            'image_url'         => 'sometimes|nullable|string|max:500',
            'date_debut'        => 'sometimes|nullable|date',
            'date_fin'          => 'sometimes|nullable|date|after_or_equal:date_debut',
            'active'            => 'sometimes|boolean',
        ]);

        // Handle unique constraint manually for code_promo (if changed).
        if (array_key_exists('code_promo', $data) && $data['code_promo']) {
            $code = $data['code_promo'];
            $exists = Promotion::where('code_promo', $code)->where('id', '!=', $promotion->id)->exists();
            abort_unless(! $exists, 422, 'Code promo déjà utilisé.');
        }

        $promotion->update($data);
        return response()->json(['message' => 'Promotion mise à jour.', 'promotion' => $promotion]);
    }

    public function destroy(Request $request, Promotion $promotion): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $promotion->delete();
        return response()->json(['message' => 'Promotion supprimée.']);
    }
}

