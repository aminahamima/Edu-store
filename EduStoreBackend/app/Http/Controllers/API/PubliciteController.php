<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Publicite;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PubliciteController extends Controller
{
    // GET /api/publicites
    public function index(Request $request): JsonResponse
    {
        $query = Publicite::query();

        // For public browsing: only return active items within date range.
        // ?all=1 bypasses this filter only for authenticated admins.
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

        $publicites = $query->latest()->paginate($request->get('per_page', 10));
        return response()->json($publicites);
    }

    public function show(Request $request, Publicite $publicite): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            // Non-admin / public: restrict access to active entries.
            abort_unless($publicite->active, 404);
        }

        return response()->json($publicite);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'titre'       => 'required|string|max:150',
            'description' => 'nullable|string',
            'lien'        => 'nullable|string|max:255',
            'image_url'   => 'nullable|string|max:500',
            'date_debut'  => 'nullable|date',
            'date_fin'    => 'nullable|date|after_or_equal:date_debut',
            'active'      => 'boolean',
        ]);

        $publicite = Publicite::create($data);
        return response()->json(['message' => 'Publicité créée.', 'publicite' => $publicite], 201);
    }

    public function update(Request $request, Publicite $publicite): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $data = $request->validate([
            'titre'       => 'sometimes|required|string|max:150',
            'description' => 'sometimes|nullable|string',
            'lien'        => 'sometimes|nullable|string|max:255',
            'image_url'   => 'sometimes|nullable|string|max:500',
            'date_debut'  => 'sometimes|nullable|date',
            'date_fin'    => 'sometimes|nullable|date|after_or_equal:date_debut',
            'active'      => 'sometimes|boolean',
        ]);

        $publicite->update($data);
        return response()->json(['message' => 'Publicité mise à jour.', 'publicite' => $publicite]);
    }

    public function destroy(Request $request, Publicite $publicite): JsonResponse
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $publicite->delete();
        return response()->json(['message' => 'Publicité supprimée.']);
    }
}

