<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Commande extends Model
{
    protected $table = 'commandes';

    protected $fillable = [
        'numero_commande',
        'utilisateur_id',
        'date_commande',
        'statut',
        'montant_total',
        'adresse_livraison',
        'telephone_livraison',
        'mode_paiement',
    ];

    protected $casts = [
        'date_commande' => 'date',
        'montant_total' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($commande) {
            if (empty($commande->numero_commande)) {
                $commande->numero_commande = 'CMD-' . date('Y') . '-' . str_pad($commande->id, 6, '0', STR_PAD_LEFT);
                $commande->saveQuietly();
            }
        });
    }

    const STATUTS = [
        'en_attente',
        'confirmee',
        'en_livraison',
        'livree',
        'annulee',
    ];

    // ── Relations ──────────────────────────────────────────
    public function client(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Client::class, 'utilisateur_id');
    }

    public function lignes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LigneCommande::class, 'commande_id');
    }

    public function paiement(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Paiement::class, 'commande_id');
    }

    public function facture(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Facture::class, 'commande_id');
    }

    // ── Methods (from diagram) ─────────────────────────────
    public function confirmer(): void
    {
        $this->update(['statut' => 'confirmee']);
    }

    public function annuler(): void
    {
        $this->update(['statut' => 'annulee']);
    }

    public function mettreAJourStatut(string $statut): void
    {
        abort_unless(in_array($statut, self::STATUTS), 422, 'Statut invalide.');
        $this->update(['statut' => $statut]);
    }
}
