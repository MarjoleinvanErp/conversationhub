<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'privacy_consent',
        'privacy_consent_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'privacy_consent_at' => 'datetime',
        'privacy_consent' => 'boolean',
        'password' => 'hashed',
    ];

    /**
     * Check if user has given privacy consent
     */
    public function hasGivenConsent(): bool
    {
        return $this->privacy_consent && $this->privacy_consent_at !== null;
    }

    /**
     * Check if user has specific role
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if user has specific permission
     */
    public function hasPermission(string $permission): bool
    {
        // Voor nu simple role-based permissions
        $permissions = [
            'admin' => ['export_data', 'manage_users', 'manage_privacy'],
            'user' => ['export_data'],
            'viewer' => [],
        ];

        return in_array($permission, $permissions[$this->role] ?? []);
    }
}