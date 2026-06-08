<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class Utilisateur extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'mot_de_passe',
        'telephone',
        'role',
    ];

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    // ---- JWT obligatoire ----
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role'   => $this->role,
            'nom'    => $this->nom,
            'prenom' => $this->prenom,
            'email'  => $this->email,
        ];
    }

    // Override password field pour JWT
    public function getAuthPassword()
    {
        return $this->mot_de_passe;
    }

    // ---- Relations ----
    public function client()
    {
        // Dans `clients`, la clé primaire `id` référence `utilisateurs.id`
        return $this->hasOne(Client::class, 'id', 'id');
    }

    public function administrateur()
    {
        return $this->hasOne(Administrateur::class, 'utilisateur_id');
    }

    public function commandes()
    {
        return $this->hasMany(Commande::class, 'utilisateur_id');
    }

    public function panier()
    {
        return $this->hasOne(Panier::class, 'utilisateur_id');
    }

    // ---- Helpers ----
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    /**
     * Profil client lié à l'utilisateur (même id). Crée la ligne `clients` si elle manque
     * (évite "Call to a member function paniers() on null" au panier / checkout).
     * Les admins n'ont pas de fiche client : retourne null.
     */
    public function getOrCreateClient(): ?Client
    {
        if ($this->isAdmin()) {
            return null;
        }

        $client = $this->client()->first();
        if ($client) {
            return $client;
        }

        return Client::firstOrCreate(
            ['id' => $this->id],
            ['adresse_livraison' => null]
        );
    }
}
