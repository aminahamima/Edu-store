<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $table = 'clients';
    protected $primaryKey = 'id';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'adresse_livraison',
        'historique_commandes',
    ];

    // ── Relations ──────────────────────────────────────────
    public function utilisateur(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'id');
    }

    public function paniers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Panier::class, 'utilisateur_id');
    }

    public function commandes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Commande::class, 'utilisateur_id');
    }

    // ── Methods ────────────────────────────────────────────
    public function passerCommande(): Commande
    {
        return $this->commandes()->create([
            'date_commande' => now()->toDateString(),
            'statut'        => 'en_attente',
            'montant_total' => 0,
        ]);
    }

    public function getPanierActif(): ?Panier
    {
        return $this->paniers()->where('statut', 'actif')->latest()->first();
    }
}
