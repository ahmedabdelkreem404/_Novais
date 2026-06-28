<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_and_subscription_columns_exist(): void
    {
        $this->assertTrue(Schema::hasColumns('payments', [
            'plan_id',
            'provider_order_id',
            'provider_transaction_id',
            'paid_at',
            'failed_at',
            'cancelled_at',
        ]));

        $this->assertTrue(Schema::hasColumns('subscriptions', [
            'payment_method',
            'card_last4',
            'plan_limit',
            'plan_price',
        ]));
    }

    public function test_payment_and_subscription_indexes_exist(): void
    {
        $paymentIndexes = collect(Schema::getIndexes('payments'))->pluck('name')->all();
        $subscriptionIndexes = collect(Schema::getIndexes('subscriptions'))->pluck('name')->all();

        $this->assertContains('payments_transaction_id_unique', $paymentIndexes);
        $this->assertContains('payments_provider_order_id_index', $paymentIndexes);
        $this->assertContains('payments_provider_transaction_id_unique', $paymentIndexes);
        $this->assertContains('payments_user_id_status_index', $paymentIndexes);
        $this->assertContains('subscriptions_user_id_status_index', $subscriptionIndexes);
    }

    public function test_chat_table_exists(): void
    {
        $this->assertTrue(Schema::hasTable('chats'));
        $this->assertTrue(Schema::hasColumns('chats', [
            'user_id',
            'course_id',
            'role',
            'message',
        ]));
    }

    public function test_offline_payment_requests_schema_exists(): void
    {
        $this->assertTrue(Schema::hasTable('offline_payment_requests'));
        $this->assertTrue(Schema::hasColumns('offline_payment_requests', [
            'user_id',
            'plan_id',
            'billing_cycle',
            'amount',
            'currency',
            'method',
            'sender_phone',
            'sender_name',
            'transaction_reference',
            'proof_image_path',
            'status',
            'admin_id',
            'admin_note',
            'approved_at',
            'rejected_at',
        ]));

        $indexes = collect(Schema::getIndexes('offline_payment_requests'))->pluck('name')->all();

        $this->assertContains('offline_payment_requests_user_id_status_index', $indexes);
        $this->assertContains('offline_payment_requests_method_status_index', $indexes);
        $this->assertContains('offline_payment_requests_plan_id_billing_cycle_index', $indexes);
        $this->assertContains('offline_payment_requests_transaction_reference_unique', $indexes);
    }
}
