<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('produits', function (Blueprint $table) {
            // Liste d'URLs d'images (JSON)
            $table->json('images')->nullable()->after('image');

            // Image de promotion (URL)
            $table->string('promo_image', 255)->nullable()->after('images');
        });
    }

    public function down(): void
    {
        Schema::table('produits', function (Blueprint $table) {
            $table->dropColumn(['images', 'promo_image']);
        });
    }
};

