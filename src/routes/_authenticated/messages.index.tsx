import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/")({
  component: () => (
    <Card className="h-full min-h-[400px] grid place-items-center">
      <div className="text-center text-muted-foreground">
        <MessagesSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Select a project to start chatting</p>
      </div>
    </Card>
  ),
});
