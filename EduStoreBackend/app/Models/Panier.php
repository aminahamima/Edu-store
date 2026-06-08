<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Panier extends Model
{
    protected $table = 'paniers';

    protected $fillable = [
        'utilisateur_id',
        'statut',
    ];

    // ── Relations ──────────────────────────────────────────
    public function utilisateur(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }

    public function lignes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LignePanier::class, 'panier_id');
    }

    // ── Methods (from diagram) ─────────────────────────────
    public function ajouterProduit(Produit $produit, int $quantite = 1): LignePanier
    {
        $ligne = $this->lignes()->where('produit_id', $produit->id)->first();

        if ($ligne) {
            $ligne->increment('quantite', $quantite);
            return $ligne;
        }

        return $this->lignes()->create([
            'produit_id'   => $produit->id,
            'quantite'     => $quantite,
            'prix_unitaire'=> $produit->prix,
        ]);
    }

    public function supprimerProduit(Produit $produit): void
    {
        $this->lignes()->where('produit_id', $produit->id)->delete();
    }

    public function calculerTotal(): float
    {
        return (float) $this->lignes->sum(fn($l) => $l->quantite * $l->prix_unitaire);
    }

    public function vider(): void
    {
        $this->lignes()->delete();
    }
}
