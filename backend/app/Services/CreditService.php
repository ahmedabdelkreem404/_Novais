<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;

class CreditService
{
    /**
     * Check if user has enough credits.
     * 
     * @param User $user
     * @param int $required
     * @return bool
     */
    public function hasEnoughCredits(User $user, int $required): bool
    {
        if ($user->role === 'admin') {
            return true;
        }
        return $user->remaining_credits >= $required;
    }

    /**
     * Deduct credits from user.
     * 
     * @param User $user
     * @param int $amount
     * @return void
     */
    public function deductCredits(User $user, int $amount)
    {
        if ($user->role === 'admin') {
            return;
        }

        // Safely update credits preventing negative value on unsigned column
        $newBalance = max(0, $user->remaining_credits - $amount);
        $user->remaining_credits = $newBalance;
        $user->save();
        
        Log::info('Credits Deducted', [
            'user_id' => $user->id,
            'amount' => $amount,
            'remaining' => $user->remaining_credits
        ]);
        
        
        // Log to aiUsageLogs if needed
        $user->aiUsageLogs()->create([
            'feature' => 'ai_generation',
            'action' => 'ai_generation',
            'tokens_used' => $amount,
            'cost_multiplier' => 1, // Currently 1:1
        ]);
    }

    /**
     * Add credits to user.
     * 
     * @param User $user
     * @param int $amount
     * @return void
     */
    public function addCredits(User $user, int $amount)
    {
        $user->increment('total_credits', $amount);
        $user->increment('remaining_credits', $amount);
        
        Log::info('Credits Added', [
            'user_id' => $user->id,
            'amount' => $amount,
            'new_total' => $user->total_credits
        ]);
    }
}
