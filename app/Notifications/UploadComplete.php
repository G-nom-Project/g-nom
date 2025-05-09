<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UploadComplete extends Notification
{
    use Queueable;

    public string $filePath;

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
    }

    public function via(object $notifiable): array
    {
        return ['broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Success',
            'variant' => 'success',
            'message' => 'File uploaded successfully.',
            'path' => $this->filePath,
            'icon' => 'bi bi-cloud-check'
        ];
    }
}
