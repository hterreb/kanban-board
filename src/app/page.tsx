import KanbanBoard from "@/components/kanban-board";

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="flex flex-col gap-8">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <KanbanBoard />
      </main>
    </div>
  );
}
