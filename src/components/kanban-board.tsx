'use client'

import React, { useState } from 'react'
import { PlusCircle, MoreVertical, Edit, Trash2, Calendar, Tag, AlignLeft, CheckSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type ChecklistItem = {
  id: string
  text: string
  checked: boolean
}

type Label = {
  id: string
  text: string
  color: string
}

type KanbanCard = {
  id: string
  content: string
  description: string
  labels: Label[]
  dueDate: Date | null
  checklist: ChecklistItem[]
}

type KanbanColumn = {
  id: string
  title: string
  cards: KanbanCard[]
}

const LABEL_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-gray-500',
]

export default function KanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'todo', title: 'To Do', cards: [] },
    { id: 'inprogress', title: 'In Progress', cards: [] },
    { id: 'done', title: 'Done', cards: [] },
  ])

  const [newCardContent, setNewCardContent] = useState('')
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [draggedCard, setDraggedCard] = useState<{ id: string; columnId: string } | null>(null)
  const [newLabel, setNewLabel] = useState({ text: '', color: LABEL_COLORS[0] })

  const addCard = (columnId: string) => {
    if (newCardContent.trim() === '') return

    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.id === columnId
          ? {
              ...column,
              cards: [
                ...column.cards,
                {
                  id: Date.now().toString(),
                  content: newCardContent.trim(),
                  description: '',
                  labels: [],
                  dueDate: null,
                  checklist: [],
                },
              ],
            }
          : column
      )
    )

    setNewCardContent('')
  }

  const moveCard = (cardId: string, sourceColumnId: string, targetColumnId: string) => {
    setColumns(prevColumns => {
      const sourceColumn = prevColumns.find(col => col.id === sourceColumnId)
      const targetColumn = prevColumns.find(col => col.id === targetColumnId)

      if (!sourceColumn || !targetColumn) return prevColumns

      const card = sourceColumn.cards.find(c => c.id === cardId)
      if (!card) return prevColumns

      const updatedColumns = prevColumns.map(column => {
        if (column.id === sourceColumnId) {
          return { ...column, cards: column.cards.filter(c => c.id !== cardId) }
        }
        if (column.id === targetColumnId) {
          return { ...column, cards: [...column.cards, card] }
        }
        return column
      })

      return updatedColumns
    })
  }

  const handleDragStart = (e: React.DragEvent | React.TouchEvent, cardId: string, columnId: string) => {
    if (e.type === 'touchstart') {
      setDraggedCard({ id: cardId, columnId })
    } else {
      (e as React.DragEvent).dataTransfer.setData('cardId', cardId)
      ;(e as React.DragEvent).dataTransfer.setData('columnId', columnId)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent | React.TouchEvent, targetColumnId: string) => {
    e.preventDefault()
    let cardId, sourceColumnId

    if (e.type === 'touchend' && draggedCard) {
      cardId = draggedCard.id
      sourceColumnId = draggedCard.columnId
      setDraggedCard(null)
    } else {
      cardId = (e as React.DragEvent).dataTransfer.getData('cardId')
      sourceColumnId = (e as React.DragEvent).dataTransfer.getData('columnId')
    }

    if (cardId && sourceColumnId) {
      moveCard(cardId, sourceColumnId, targetColumnId)
    }
  }

  const editCard = (columnId: string, cardId: string, updates: Partial<KanbanCard>) => {
    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.id === columnId
          ? {
              ...column,
              cards: column.cards.map(card =>
                card.id === cardId ? { ...card, ...updates } : card
              ),
            }
          : column
      )
    )
  }

  const deleteCard = (columnId: string, cardId: string) => {
    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.id === columnId
          ? {
              ...column,
              cards: column.cards.filter(card => card.id !== cardId),
            }
          : column
      )
    )
  }

  const addColumn = () => {
    if (newColumnTitle.trim() === '') return

    const newColumn: KanbanColumn = {
      id: Date.now().toString(),
      title: newColumnTitle.trim(),
      cards: [],
    }

    setColumns(prevColumns => [...prevColumns, newColumn])
    setNewColumnTitle('')
  }

  const editColumn = (columnId: string, newTitle: string) => {
    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.id === columnId ? { ...column, title: newTitle } : column
      )
    )
  }

  const deleteColumn = (columnId: string) => {
    setColumns(prevColumns => prevColumns.filter(column => column.id !== columnId))
  }

  const addChecklistItem = (columnId: string, cardId: string, itemText: string) => {
    editCard(columnId, cardId, {
      checklist: [
        ...(columns.find(col => col.id === columnId)?.cards.find(card => card.id === cardId)?.checklist || []),
        { id: Date.now().toString(), text: itemText, checked: false },
      ],
    })
  }

  const toggleChecklistItem = (columnId: string, cardId: string, itemId: string) => {
    const card = columns.find(col => col.id === columnId)?.cards.find(card => card.id === cardId)
    if (card) {
      const updatedChecklist = card.checklist.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
      editCard(columnId, cardId, { checklist: updatedChecklist })
    }
  }

  const addLabel = (columnId: string, cardId: string, label: Label) => {
    const card = columns.find(col => col.id === columnId)?.cards.find(card => card.id === cardId)
    if (card && !card.labels.some(l => l.text === label.text)) {
      editCard(columnId, cardId, { labels: [...card.labels, label] })
    }
    setNewLabel({ text: '', color: LABEL_COLORS[0] })
  }

  const removeLabel = (columnId: string, cardId: string, labelId: string) => {
    const card = columns.find(col => col.id === columnId)?.cards.find(card => card.id === cardId)
    if (card) {
      editCard(columnId, cardId, { labels: card.labels.filter(l => l.id !== labelId) })
    }
  }

  const getChecklistProgress = (checklist: ChecklistItem[]) => {
    if (checklist.length === 0) return 0
    const checkedItems = checklist.filter(item => item.checked).length
    return (checkedItems / checklist.length) * 100
  }

  const getCardColor = (card: KanbanCard) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (card.checklist.length > 0 && card.checklist.every(item => item.checked)) {
      return 'bg-green-100'
    }

    if (card.dueDate) {
      const dueDate = new Date(card.dueDate)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        return 'bg-red-100'
      }

      const threeDaysFromNow = new Date(today)
      threeDaysFromNow.setDate(today.getDate() + 3)

      if (dueDate <= threeDaysFromNow) {
        return 'bg-orange-100'
      }
    }

    return ''
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Kanban Board</h1>
      <div className="flex flex-wrap gap-4">
        {columns.map(column => (
          <div
            key={column.id}
            className="bg-gray-100 p-4 rounded-lg shadow-md flex-1 min-w-[250px]"
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, column.id)}
            onTouchEnd={e => handleDrop(e, column.id)}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">{column.title}</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => {
                    const newTitle = prompt('Edit list title:', column.title)
                    if (newTitle) editColumn(column.id, newTitle)
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit List
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => deleteColumn(column.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {column.cards.map(card => (
              <Card
                key={card.id}
                draggable
                onDragStart={e => handleDragStart(e, card.id, column.id)}
                onTouchStart={e => handleDragStart(e, card.id, column.id)}
                className={`mb-2 cursor-move ${getCardColor(card)}`}
              >
                <CardContent className="p-2">
                  <div className="flex justify-between items-start">
                    <p>{card.content}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => {
                          const newContent = prompt('Edit card:', card.content)
                          if (newContent) editCard(column.id, card.id, { content: newContent })
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => deleteCard(column.id, card.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={e => e.preventDefault()}>
                              <AlignLeft className="mr-2 h-4 w-4" />
                              Description
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Description</DialogTitle>
                            </DialogHeader>
                            <Textarea
                              value={card.description}
                              onChange={e => editCard(column.id, card.id, { description: e.target.value })}
                              placeholder="Enter description..."
                            />
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={e => e.preventDefault()}>
                              <Tag className="mr-2 h-4 w-4" />
                              Labels
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Labels</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {card.labels.map(label => (
                                <Badge
                                  key={label.id}
                                  variant="secondary"
                                  className={`flex items-center gap-1 text-white ${label.color}`}
                                >
                                  {label.text}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 text-white"
                                    onClick={() => removeLabel(column.id, card.id, label.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={newLabel.text}
                                onChange={e => setNewLabel({ ...newLabel, text: e.target.value })}
                                placeholder="New label..."
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className={`w-10 h-10 p-0 ${newLabel.color}`} />
                                </PopoverTrigger>
                                <PopoverContent className="w-40">
                                  <div className="flex flex-wrap gap-1">
                                    {LABEL_COLORS.map(color => (
                                      <Button
                                        key={color}
                                        className={`w-8 h-8 p-0 ${color}`}
                                        onClick={() => setNewLabel({ ...newLabel, color })}
                                      />
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <Button onClick={() => addLabel(column.id, card.id, { ...newLabel, id: Date.now().toString() })}>
                                Add
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={e => e.preventDefault()}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Due Date
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Set Due Date</DialogTitle>
                            </DialogHeader>
                            <CalendarComponent
                              mode="single"
                              selected={card.dueDate || undefined}
                              onSelect={date => editCard(column.id, card.id, { dueDate: date })}
                              initialFocus
                            />
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={e => e.preventDefault()}>
                              <CheckSquare className="mr-2 h-4 w-4" />
                              Checklist
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Checklist</DialogTitle>
                            </DialogHeader>
                            {card.checklist.map(item => (
                              <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={item.id}
                                  checked={item.checked}
                                  onCheckedChange={() => toggleChecklistItem(column.id, card.id, item.id)}
                                />
                                <label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {item.text}
                                </label>
                              </div>
                            ))}
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.elements.namedItem('newItem') as HTMLInputElement;
                              if (input.value.trim() !== '') {
                                addChecklistItem(column.id, card.id, input.value);
                                input.value = '';
                              }
                            }} className="flex mt-2">
                              <Input
                                name="newItem"
                                placeholder="New item..."
                              />
                              <Button type="submit" className="ml-2">Add</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.labels.map(label => (
                        <Badge key={label.id} className={`text-white ${label.color}`}>
                          {label.text}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {card.dueDate && (
                    <p className="text-sm text-gray-500 mt-2">
                      Due: {card.dueDate.toLocaleDateString()}
                    </p>
                  )}
                  {card.checklist.length > 0 && (
                    <div className="mt-2">
                      <Progress value={getChecklistProgress(card.checklist)} className="w-full h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {card.checklist.filter(item => item.checked).length}/{card.checklist.length} completed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newCardContent.trim() !== '') {
                addCard(column.id);
              }
            }} className="mt-2">
              <Input
                type="text"
                placeholder="Add a card..."
                value={newCardContent}
                onChange={(e) => setNewCardContent(e.target.value)}
                className="mb-2"
              />
              <Button type="submit" className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Card
              </Button>
            </form>
          </div>
        ))}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-full min-w-[250px]">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New List</DialogTitle>
            </DialogHeader>
            <Input
              type="text"
              placeholder="Enter list title..."
              value={newColumnTitle}
              onChange={e => setNewColumnTitle(e.target.value)}
              className="mb-4"
            />
            <Button onClick={addColumn}>Add List</Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}