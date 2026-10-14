<?php

namespace Tests\Feature;

use Illuminate\Database\Eloquent\Model;
use Tests\TestCase;

class QualityStandardsTest extends TestCase
{
    public function test_lazy_loading_prevention_is_enabled_in_testing_environment(): void
    {
        $this->assertSame('testing', app()->environment());

        $this->assertTrue(
            Model::preventsLazyLoading(),
            'Model::preventLazyLoading() harus aktif selama testing.'
        );
    }
}
