<?php

namespace Database\Seeders;

use App\Models\Administrateur;
use App\Models\Utilisateur;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Default admin account (requested)
        $defaultAdmin = Utilisateur::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'nom'          => 'Admin',
                'prenom'       => 'Default',
                'mot_de_passe' => Hash::make('admin123'),
                'telephone'    => null,
                'role'         => 'admin',
            ]
        );

        Administrateur::updateOrCreate(
            ['utilisateur_id' => $defaultAdmin->id],
            [
                'niveau_acces'       => 1,
                'derniere_connexion' => now(),
            ]
        );

        // Admin account for login tests
        $admin = Utilisateur::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'nom'          => 'Admin',
                'prenom'       => 'Test',
                'mot_de_passe' => Hash::make('password123'),
                'telephone'    => null,
                'role'         => 'admin',
            ]
        );

        Administrateur::updateOrCreate(
            ['utilisateur_id' => $admin->id],
            [
                'niveau_acces'      => 1,
                'derniere_connexion'=> now(),
            ]
        );
    }
}
