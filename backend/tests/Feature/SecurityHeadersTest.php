<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_unauthenticated_private_download_returns_401_with_security_headers(): void
    {
        $response = $this->getJson('/api/v1/documents/1/download');

        $response->assertUnauthorized()
            ->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
            ->assertHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'DENY');

        $this->assertFalse($response->headers->has('Strict-Transport-Security'));
    }

    public function test_secure_production_responses_include_hsts(): void
    {
        config(['app.env' => 'production']);

        $response = $this->getJson('https://localhost/api/v1/documents/1/download');

        $response->assertUnauthorized()
            ->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
}
