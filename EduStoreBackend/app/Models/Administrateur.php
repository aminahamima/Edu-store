<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Administrateur extends Model
{
    protected $table = 'administrateurs';
    protected $primaryKey = 'utilisateur_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'utilisateur_id',
        'niveau_acces',
        'derniere_connexion',
    ];

    protected $casts = [
        'derniere_connexion' => 'datetime',
    ];

    // ── Relations ──────────────────────────────────────────
    public function utilisateur(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id', 'id');
    }

    // ── Methods (from diagram) ─────────────────────────────
    public function gererProduit(Produit $produit, array $data): bool
    {
        return $produit->update($data);
    }

    public function genererRapport(): array
    {
        return [
            'total_commandes' => Commande::count(),
            'total_clients'   => Client::count(),
            'total_produits'  => Produit::count(),
            'chiffre_affaires'=> Commande::where('statut', 'livree')->sum('montant_total'),
        ];
    }

    public function gererStock(Produit $produit, int $quantite): void
    {
        $produit->stock()->updateOrCreate(
            ['produit_id' => $produit->id],
            ['quantite_disponible' => $quantite, 'date_mise_a_jour' => now()->toDateString()]
        );
    }
}
