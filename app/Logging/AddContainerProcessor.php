<?php

namespace App\Logging;

class AddContainerProcessor
{
    public function __invoke($logger)
    {
        foreach ($logger->getHandlers() as $handler) {
            $handler->pushProcessor(function ($record) {
                $record['extra']['container'] = gethostname();

                return $record;
            });
        }
    }
}
