<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command('documents:check-expiry')
    ->daily()
    ->withoutOverlapping();

// Backup database harian dan retensi 7 hari
Schedule::command('db:backup --retention=7')
    ->dailyAt('02:00')
    ->withoutOverlapping();

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
