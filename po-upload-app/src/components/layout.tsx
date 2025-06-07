import { ReactNode } from "react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">PO Upload App</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Menu</Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              <a href="/" className="text-sm font-medium hover:underline pl-4">
                Dashboard
              </a>
              <a
                href="/upload"
                className="text-sm font-medium hover:underline pl-4"
              >
                Upload PO
              </a>
              <a
                href="/records"
                className="text-sm font-medium hover:underline pl-4"
              >
                Past Records
              </a>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
