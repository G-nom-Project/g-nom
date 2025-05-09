<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ImportCompleted extends Notification
{
    use Queueable;
    protected int $assemblyID;

    /**
     * Create a new notification instance.
     */
    public function __construct($assemblyID)
    {
        //
        $this->assemblyID = $assemblyID;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->line('The introduction to the notification.')
                    ->action('Notification Action', url('/'))
                    ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Success',
            'variant' => 'success',
            'message' => "Successfully imported data for assembly ID {$this->assemblyID}",
            'assemblyID' => $this->assemblyID,
            'icon' => 'bi bi-file-earmark-check'
        ];
    }
}
