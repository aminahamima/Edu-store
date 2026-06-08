<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProduitController;
use App\Http\Controllers\API\CategorieController;
use App\Http\Controllers\API\PanierController;
use App\Http\Controllers\API\CommandeController;
use App\Http\Controllers\API\StockController;
use App\Http\Controllers\API\FactureController;
use App\Http\Controllers\API\PubliciteController;
use App\Http\Controllers\API\PromotionController;

// ============================================================
// AUTH — Public
// ============================================================
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ============================================================
// PUBLIC — Catalogue (produits + catégories)
// ============================================================
Route::get('/produits', [ProduitController::class, 'index']);
Route::get('/produits/{produit}', [ProduitController::class, 'show']);
Route::get('/categories', [CategorieController::class, 'index']);

// ============================================================
// PUBLIC — Promotions & Publicités
// ============================================================
Route::get('/publicites', [PubliciteController::class, 'index']);
Route::get('/promotions', [PromotionController::class, 'index']);

// ============================================================
// PROTECTED — Requires JWT token (guard: api)
// ============================================================
Route::middleware('auth:api')->group(function () {

    // ── Auth ────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/logout',  [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me',       [AuthController::class, 'profil']);
    });

    // ── Produits (protégés : création / mise à jour / suppression) ─────────────
    // Les routes publiques `GET /produits` et `GET /produits/{id}` sont définies
    // plus haut, en dehors de ce groupe protégé.
    Route::apiResource('produits', ProduitController::class)->except(['index', 'show']);

    // ── Categories (protégées : création / mise à jour / suppression) ──────────
    // La route publique `GET /categories` est définie plus haut.
    Route::apiResource('categories', CategorieController::class)->except(['index']);

    // ── Panier ──────────────────────────────────────────────
    Route::prefix('paniers')->group(function () {
        Route::get('/',                                     [PanierController::class, 'index']);
        Route::post('/',                                    [PanierController::class, 'store']);
        Route::get('/{panier}',                             [PanierController::class, 'show']);
        Route::post('/{panier}/ajouter',                    [PanierController::class, 'ajouterProduit']);
        Route::delete('/{panier}/supprimer/{produit}',      [PanierController::class, 'supprimerProduit']);
        Route::delete('/{panier}/vider',                    [PanierController::class, 'update']);
        Route::delete('/{panier}',                          [PanierController::class, 'destroy']);
    });

    // ── Commandes ───────────────────────────────────────────
    Route::apiResource('commandes', CommandeController::class);

    // ── Stocks ──────────────────────────────────────────────
    Route::apiResource('stocks', StockController::class);

    // ── Factures ────────────────────────────────────────────
    Route::prefix('factures')->group(function () {
        Route::get('/',                 [FactureController::class, 'index']);
        Route::post('/',                [FactureController::class, 'store']);
        Route::get('/{facture}',        [FactureController::class, 'show']);
        Route::put('/{facture}',        [FactureController::class, 'update']);
        Route::delete('/{facture}',     [FactureController::class, 'destroy']);
        Route::get('/{facture}/pdf',    [FactureController::class, 'telechargerPDF']);
    });

    // ── Admin — Publications ────────────────────────────────
    Route::prefix('admin')->group(function () {
        Route::apiResource('publicites', PubliciteController::class);
        Route::apiResource('promotions', PromotionController::class);
    });

});
