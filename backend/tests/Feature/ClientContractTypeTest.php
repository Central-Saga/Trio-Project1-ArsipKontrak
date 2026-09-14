<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\ContractType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientContractTypeTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_can_be_soft_deleted()
    {
        $client = Client::create([
            'name' => 'PT Klien Sejahtera',
            'email' => 'klien@example.com',
        ]);

        $client->delete();

        $this->assertSoftDeleted('clients', [
            'id' => $client->id,
        ]);
    }

    public function test_contract_type_can_be_soft_deleted()
    {
        $contractType = ContractType::create([
            'name' => 'Kontrak Kerja Sama',
            'code' => 'KKS',
        ]);

        $contractType->delete();

        $this->assertSoftDeleted('contract_types', [
            'id' => $contractType->id,
        ]);
    }
}