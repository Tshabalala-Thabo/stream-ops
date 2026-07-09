"use client"

import { Trash2 } from "lucide-react"
import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type DeleteVideoDialogProps = {
  isDeleting: boolean
  onConfirm: () => void
  videoTitle: string
  triggerLabel?: string
  triggerSize?: React.ComponentProps<typeof Button>["size"]
}

export function DeleteVideoDialog({
  isDeleting,
  onConfirm,
  triggerLabel = "Delete",
  triggerSize = "sm",
  videoTitle,
}: DeleteVideoDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button className="gap-2" size={triggerSize} type="button" variant="destructive" />
        }
      >
        <Trash2 />
        {triggerLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this video?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove {videoTitle} and all uploaded, preview,
            and playback files attached to it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={onConfirm}
            variant="destructive"
          >
            {isDeleting ? "Deleting" : "Delete video"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
