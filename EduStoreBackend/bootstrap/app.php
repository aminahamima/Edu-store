<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',       // ← ligne ajoutée
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Pour une API, on ne redirige pas vers une route "login" (web).
        // Sur /api/*, on laisse l'auth middleware déclencher une 401 JSON.
        $middleware->redirectGuestsTo(function ($request) {
            return $request->is('api/*') ? null : null;
        });
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Forcer une réponse JSON sur toutes les routes API.
        // Sinon Laravel peut rediriger vers `route('login')` si le client n'indique pas `Accept: application/json`.
        $exceptions->shouldRenderJsonWhen(function ($request, $e) {
            return $request->is('api/*');
        });
    })->create();
    
