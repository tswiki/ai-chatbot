'use client'; // Ensure the component can handle interactivity

import { buttonVariants } from "@/components/ui/button"; // Assuming buttonVariants handles button styling
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CollectionsPopoverProps {
  className?: string;
  children?: React.ReactNode;
}

export function CollectionsPopover({ className, children }: CollectionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks to close the dialog
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Add event listener when dialog is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {/* Button to open the dialog */}
        <Button className={cn(className)} variant="ghost" onClick={() => setIsOpen(true)}>
          {children || "Collections"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogOverlay />

      {/* Dialog content */}
      <AlertDialogContent
        ref={dialogRef}
        className="flex flex-col items-center justify-center text-center space-y-6"
        style={{
          width: '80%', // Width proportional to viewport
          maxWidth: '500px', // Set a reasonable max width for large screens
          padding: '2rem', // Proportional padding based on content
          margin: '0 auto', // Ensure the content is centered horizontally
        }}
      >
        <AlertDialogHeader>
          {/* Make "Creators" the focus with larger font size */}
          <AlertDialogTitle className="text-2xl font-bold text-center">
            Currently Indexed Creators
          </AlertDialogTitle>
        </AlertDialogHeader>

        {/* Scrollable section for names */}
        <div className="flex justify-center w-full relative">
          <AlertDialogDescription 
            className="text-center overflow-y-auto w-full"
            style={{
              height: '3rem', // Show only one row at a time (adjust based on font size)
              display: 'grid',
              placeItems: 'center',
              maxHeight: '3rem', // Limit height for scrolling
              scrollbarWidth: 'thin',
            }}
          >
            <div className="text-lg relative">
              <div className="py-2 border-b border-t border-gray-300">Alex Hormozi</div>
              <div className="py-2 border-b border-t border-gray-300">Iman Gadhzi</div>
              <div className="py-2 border-b border-gray-300">Serge Gatari</div>
              <div className="py-2 border-b border-gray-300">Ben Bader</div>
              <div className="py-2 border-b border-gray-300">Pierre Khoury</div>
              <div className="py-2 border-b border-gray-300">Toussaint Gilbert</div>
              <div className="py-2 border-b border-gray-300">Nik Setting</div>
              <div className="py-2 border-b border-gray-300">Montell Gordon</div>
              <div className="py-2 border-b border-gray-300">Evan Vance</div>
              <div className="py-2 border-b border-gray-300">Dylan Wilson</div>
            </div>
          </AlertDialogDescription>
        </div>

        {/* Decreased size of the input box with a white outline */}
        <div className="w-full max-w-xs flex justify-center">
          <Input
            type="text"
            placeholder="Submit a Creator Request."
            className="text-sm py-2 px-4 w-full text-center"
            style={{
              padding: '0.5rem 0.75rem', // Reduced padding for a smaller input size
              fontSize: '1rem', // Adjusted for readability
              textAlign: 'center', // Ensure text and placeholder are centered
              border: '2px solid white', // White outline around the input box
            }}
          />
        </div>

        {/* Centered Submit button with padding from the right */}
        <AlertDialogFooter className="mt-4 w-full flex justify-center items-center">
          <Button
            variant="ghost"
            className={cn('w-auto')}
            style={{
              padding: '8px 12px', // Adjusted padding to balance the button alignment
              fontSize: '0.875rem', // Slightly smaller font size to match the reduced button size
              width: 'auto', // Use 'auto' to make the width responsive to the content
              maxWidth: '150px', // Set a max width for larger screen sizes
              minWidth: '100px', // Prevent the button from becoming too small
              display: 'flex',
              justifyContent: 'center', // Ensure content is centrally aligned horizontally
              alignItems: 'center', // Ensure content is centrally aligned vertically
              textAlign: 'center', // Ensure the text inside the button is centered
              border: '2px solid white', // White outline around button text
              marginRight: 'auto', // Ensures equal padding on both sides
              marginLeft: 'auto', // Ensures equal padding on both sides
            }}
          >
            Submit
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
