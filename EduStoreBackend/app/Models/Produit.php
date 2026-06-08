<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Produit extends Model
{
    protected $table = 'produits';

    protected $fillable = [
        'nom',
        'description',
        'prix',
        'image',
        'images',
        'promo_image',
        'niveau_scolaire',
        'langue',
        'disponible',
        'categorie_id',
    ];

    protected $casts = [
        'prix'       => 'decimal:2',
        'disponible' => 'boolean',
        'images'     => 'array',
    ];

    protected $appends = ['image_url', 'images_urls'];

    // ── Relations ──────────────────────────────────────────
    public function categorie(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Categorie::class, 'categorie_id');
    }

    public function stock(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Stock::class, 'produit_id');
    }

    public function lignePaniers(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LignePanier::class, 'produit_id');
    }

    public function ligneCommandes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LigneCommande::class, 'produit_id');
    }

    // ── Methods (from diagram) ─────────────────────────────
    public function afficherDetails(): array
    {
        return $this->load('categorie', 'stock')->toArray();
    }

    public function verifierStock(): bool
    {
        return $this->stock && $this->stock->quantite_disponible > 0;
    }

    public function mettreAJourStock(int $quantite): void
    {
        $this->stock()->updateOrCreate(
            ['produit_id' => $this->id],
            [
                'quantite_disponible' => $quantite,
                'date_mise_a_jour'    => now()->toDateString(),
            ]
        );
    }

    // ── Accessors ───────────────────────────────────────────
    public function getImageUrlAttribute(): ?string
    {
        if ($this->image) {
            // If it's already a full URL, return it
            if (filter_var($this->image, FILTER_VALIDATE_URL)) {
                return $this->image;
            }
            // If it's a storage path, generate URL
            return Storage::url($this->image);
        }
        return null;
    }

    public function getImagesUrlsAttribute(): array
    {
        $urls = [];
        if ($this->images && is_array($this->images)) {
            foreach ($this->images as $image) {
                if (filter_var($image, FILTER_VALIDATE_URL)) {
                    $urls[] = $image;
                } else {
                    $urls[] = Storage::url($image);
                }
            }
        }
        return $urls;
    }
}
