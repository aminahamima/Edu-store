<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\Client;
use App\Models\Administrateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    // ---- INSCRIPTION ----
    public function register(Request $request)
    {
        $request->validate([
            'nom'                  => 'required|string|max:100',
            'prenom'               => 'required|string|max:100',
            'email'                => 'required|email|unique:utilisateurs,email',
            'mot_de_passe'         => 'required|string|min:6|confirmed',
            'telephone'            => 'nullable|string|max:20',
            'adresse_livraison'    => 'nullable|string|max:255',
        ]);

        $utilisateur = Utilisateur::create([
            'nom'          => $request->nom,
            'prenom'       => $request->prenom,
            'email'        => $request->email,
            'mot_de_passe' => Hash::make($request->mot_de_passe),
            'telephone'    => $request->telephone,
            'role'         => 'client',
        ]);

        Client::create([
            // Dans ta table `clients`, la clé primaire `id` référence `utilisateurs.id`
            'id'                 => $utilisateur->id,
            'adresse_livraison' => $request->adresse_livraison,
        ]);

        $token = JWTAuth::fromUser($utilisateur);

        return response()->json([
            'message'     => 'Inscription réussie !',
            'utilisateur' => $utilisateur,
            'token'       => $token,
            'token_type'  => 'bearer',
        ], 201);
    }

    // ---- CONNEXION ----
    public function login(Request $request)
    {
        // Supporte les 2 formats (front FR: mot_de_passe, front standard: password)
        $request->validate([
            'email'        => 'required|email',
            'mot_de_passe' => 'required_without:password|string',
            'password'     => 'required_without:mot_de_passe|string',
        ]);

        $guard = auth('api');
        /** @var \Tymon\JWTAuth\JWTGuard $guard */

        $plainPassword = $request->mot_de_passe ?? $request->password;

        // Debug plus clair: email inexistant vs mot de passe incorrect
        $utilisateur = Utilisateur::where('email', $request->email)->first();
        if (!$utilisateur) {
            $debug = null;
            if (config('app.debug')) {
                try {
                    $debug = [
                        'db_connection' => config('database.default'),
                        'db_database' => DB::connection()->getDatabaseName(),
                    ];
                } catch (\Throwable $e) {
                    $debug = ['db_error' => $e->getMessage()];
                }
            }
            return response()->json([
                'message' => 'Email introuvable.',
                'debug' => $debug,
            ], 401);
        }

        if (!Hash::check($plainPassword, $utilisateur->mot_de_passe)) {
            return response()->json([
                'message' => 'Mot de passe incorrect.',
            ], 401);
        }

        // Génération JWT (tymon/jwt-auth) à partir de l'utilisateur validé
        $token = $guard->login($utilisateur);
        if (!$token) {
            return response()->json([
                'message' => 'Impossible de générer le token JWT (vérifier guard/provider jwt).',
            ], 500);
        }

        // Mettre à jour derniere_connexion si admin
        if ($utilisateur->isAdmin()) {
            Administrateur::where('utilisateur_id', $utilisateur->id)
                ->update(['derniere_connexion' => now()]);
        }

        return response()->json([
            'message'     => 'Connexion réussie !',
            'utilisateur' => $utilisateur,
            'role'        => $utilisateur->role,
            'token'       => $token,
            'token_type'  => 'bearer',
            'expires_in'  => $guard->factory()->getTTL() * 60,
        ]);
    }

    // ---- DÉCONNEXION ----
    public function logout()
    {
        $guard = auth('api');
        /** @var \Tymon\JWTAuth\JWTGuard $guard */
        $guard->logout();
        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    // ---- REFRESH TOKEN ----
    public function refresh()
    {
        $guard = auth('api');
        /** @var \Tymon\JWTAuth\JWTGuard $guard */
        $token = $guard->refresh();
        return response()->json([
            'token'      => $token,
            'token_type' => 'bearer',
        ]);
    }

    // ---- PROFIL ----
    public function profil()
    {
        $guard = auth('api');
        /** @var \Tymon\JWTAuth\JWTGuard $guard */
        $user = $guard->user();
        /** @var Utilisateur $user */
        $user->load('client', 'administrateur');
        return response()->json($user);
    }
}
