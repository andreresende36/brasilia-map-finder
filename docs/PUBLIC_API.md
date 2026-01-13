## Documentação de API Pública (Frontend + Backend)

Este documento descreve **todas as APIs públicas** expostas por este repositório:

- **Backend (HTTP)**: endpoint `/api/scrape`
- **Frontend (TypeScript/React)**: funções em `src/lib`, hooks em `src/hooks`, tipos em `src/types`, componentes em `src/components` e `src/components/ui`

### Convenções de importação

- O projeto usa alias `@` apontando para `src/`. Ex.: `import { cn } from "@/lib/utils"`.
- Componentes de página são **default exports** em `src/pages/*`.

---

## Backend (HTTP) — `server/index.ts`

### POST `/api/scrape`

Faz scraping de uma URL do DFImóveis (listagem/busca) e retorna imóveis com coordenadas.

- **URL**: `/api/scrape`
- **Método**: `POST`
- **Content-Type**: `application/json`
- **Body**:
  - **url**: `string` (obrigatório) — deve conter `dfimoveis.com.br`

#### Exemplo (cURL)

```bash
curl -X POST "http://localhost:3001/api/scrape" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.dfimoveis.com.br/aluguel/df/todos/apartamento?valorfinal=5000"}'
```

#### Resposta (sucesso) — `ScrapingResult`

- **success**: `true`
- **properties**: `Property[]` (apenas imóveis com latitude/longitude válidas)
- **total**: `number` (quantidade retornada)
- **errors**: `string[]` (até 10 mensagens de erro/avisos)

#### Resposta (erro de validação: URL inválida) — HTTP `400`

- `success: false` e `errors: ["URL inválida. Use uma URL do DFImóveis."]`

#### Resposta (erro interno) — HTTP `500`

- `success: false` e `errors: [<mensagem>]`

### Variáveis de ambiente (backend)

- **PORT**: porta do servidor (default `3001`)
- **NODE_ENV**:
  - `production`: serve também o frontend compilado em `dist/`

### Notas de comportamento

- O backend usa **Puppeteer (com stealth plugin)** para carregar páginas e evitar bloqueios.
- A listagem é limitada a **30 links** (performance) e os erros retornados são limitados a **10 mensagens**.

---

## Frontend — Tipos (`src/types/property.ts`)

### `Property`

- **id**: `string`
- **title**: `string`
- **price**: `string` (ex.: `"R$ 3.500"`)
- **priceValue**: `number` (valor numérico extraído; pode ser `0` se indisponível)
- **image**: `string` (URL)
- **link**: `string` (URL do anúncio)
- **latitude**: `number`
- **longitude**: `number`

### `ScrapingResult`

- **success**: `boolean`
- **properties**: `Property[]`
- **total**: `number`
- **errors**: `string[]`

---

## Frontend — API de rede (`src/lib/api.ts`)

### `scrapeProperties(url: string): Promise<ScrapingResult>`

Cliente HTTP do endpoint de scraping.

- **Entrada**: uma URL de busca do DFImóveis
- **Saída**: um `ScrapingResult`
- **Erro**: não lança na maioria dos casos; em falha retorna `{ success:false, ... }` com `errors[]` preenchido

#### Configuração

- **VITE_API_URL**: base URL do backend
  - default: `http://localhost:3001`

#### Exemplo

```ts
import { scrapeProperties } from "@/lib/api";

const result = await scrapeProperties(
  "https://www.dfimoveis.com.br/aluguel/df/todos/apartamento?valorfinal=5000",
);

if (result.success) {
  console.log(result.total, result.properties);
} else {
  console.error(result.errors);
}
```

---

## Frontend — Utilitários (`src/lib/utils.ts`)

### `cn(...inputs: ClassValue[]): string`

Helper para combinar classes (Tailwind) com deduplicação/merge via `tailwind-merge`.

#### Exemplo

```ts
import { cn } from "@/lib/utils";

const className = cn("p-2", true && "bg-primary", "p-4"); // "bg-primary p-4"
```

---

## Frontend — Hooks

### `useToast()` e `toast()` — `src/hooks/use-toast.ts`

API de toast estilo shadcn (estado global em memória + reducer).

- **toast(props)**: cria um toast e retorna handlers `{ id, dismiss, update }`
- **useToast()**: retorna `{ toasts, toast, dismiss }`

#### Exemplo (imperativo)

```ts
import { toast } from "@/hooks/use-toast";

toast({ title: "Pronto!", description: "Imóveis carregados com sucesso." });
```

#### Exemplo (hook)

```tsx
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function Exemplo() {
  const { toast } = useToast();
  return (
    <Button onClick={() => toast({ title: "Olá", description: "Toast via hook" })}>
      Abrir toast
    </Button>
  );
}
```

> Observação: `src/components/ui/use-toast.ts` apenas **reexporta** `useToast` e `toast` de `src/hooks/use-toast.ts`.

### `useIsMobile()` — `src/hooks/use-mobile.tsx`

Retorna `true` quando `window.innerWidth < 768`.

#### Exemplo

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

export function Layout() {
  const isMobile = useIsMobile();
  return <div>{isMobile ? "Mobile" : "Desktop"}</div>;
}
```

---

## Frontend — Componentes “core” (`src/components/*`)

### `Header` — `src/components/Header.tsx`

Cabeçalho da aplicação.

#### Uso

```tsx
import { Header } from "@/components/Header";

export function Page() {
  return <Header />;
}
```

### `SearchBar` — `src/components/SearchBar.tsx`

Barra de busca por URL do DFImóveis.

- **Props**:
  - **onSearch**: `(url: string) => void`
  - **isLoading**: `boolean`

#### Uso

```tsx
import { SearchBar } from "@/components/SearchBar";

<SearchBar isLoading={false} onSearch={(url) => console.log("Buscar:", url)} />;
```

### `PriceFilter` — `src/components/PriceFilter.tsx`

Filtro de faixa de preço (mínimo/máximo).

- **Props**:
  - **minPrice**: `number`
  - **maxPrice**: `number`
  - **onFilterChange**: `(min: number, max: number) => void`

#### Uso

```tsx
import { PriceFilter } from "@/components/PriceFilter";

<PriceFilter minPrice={1000} maxPrice={6000} onFilterChange={(min, max) => console.log({ min, max })} />;
```

### `PropertyList` — `src/components/PropertyList.tsx`

Lista de imóveis com seleção.

- **Props**:
  - **properties**: `Property[]`
  - **selectedId?**: `string`
  - **onSelect**: `(property: Property) => void`

#### Uso

```tsx
import { PropertyList } from "@/components/PropertyList";
import type { Property } from "@/types/property";

const props: Property[] = [];
<PropertyList properties={props} selectedId={props[0]?.id} onSelect={(p) => console.log("Selecionou", p.id)} />;
```

### `PropertyCard` — `src/components/PropertyCard.tsx`

Card clicável de imóvel.

- **Props**:
  - **property**: `Property`
  - **isSelected?**: `boolean`
  - **onClick?**: `() => void`

### `PropertyMap` — `src/components/PropertyMap.tsx`

Mapa (Leaflet) com markers e seleção.

- **Props**:
  - **properties**: `Property[]`
  - **selectedProperty?**: `Property`
  - **onSelectProperty**: `(property: Property) => void`

#### Uso

```tsx
import { PropertyMap } from "@/components/PropertyMap";
import type { Property } from "@/types/property";

const properties: Property[] = [];
<PropertyMap
  properties={properties}
  selectedProperty={properties[0]}
  onSelectProperty={(p) => console.log("Selecionou no mapa", p.id)}
/>;
```

### `PropertyPopup` — `src/components/PropertyPopup.tsx`

Popup visual para imóvel.

- **Props**:
  - **property**: `Property`

### `LoadingState` — `src/components/LoadingState.tsx`

Estado de carregamento.

- **Props**:
  - **message?**: `string` (default `"Buscando imóveis..."`)

### `ErrorState` — `src/components/ErrorState.tsx`

Estado de erro com retry opcional.

- **Props**:
  - **message**: `string`
  - **onRetry?**: `() => void`

### `NavLink` (compat) — `src/components/NavLink.tsx`

Wrapper em cima de `react-router-dom` para suportar `activeClassName` e `pendingClassName` (estilo v5).

- **Props**: `NavLinkProps` (do `react-router-dom`), exceto `className` (substituída por string), mais:
  - **className?**: `string`
  - **activeClassName?**: `string`
  - **pendingClassName?**: `string`

#### Uso

```tsx
import { NavLink } from "@/components/NavLink";

<NavLink to="/" className="px-2" activeClassName="font-bold" pendingClassName="opacity-50">
  Home
</NavLink>;
```

---

## Frontend — UI Primitives (`src/components/ui/*`)

Os componentes em `src/components/ui/*` seguem o padrão do **shadcn/ui** (muitos baseados em Radix UI).
Aqui está a lista completa de exports públicos por módulo, com um exemplo mínimo por categoria.

### Ações / Formulários

- `button.tsx`: `Button`, `buttonVariants`, `ButtonProps`
- `input.tsx`: `Input`
- `textarea.tsx`: `Textarea`, `TextareaProps`
- `label.tsx`: `Label`
- `checkbox.tsx`: `Checkbox`
- `radio-group.tsx`: `RadioGroup`, `RadioGroupItem`
- `switch.tsx`: `Switch`
- `select.tsx`: `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`
- `slider.tsx`: `Slider`
- `input-otp.tsx`: `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`
- `form.tsx`: `useFormField`, `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `FormField`

Exemplo (Button + Input):

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Exemplo() {
  return (
    <div className="flex gap-2">
      <Input placeholder="Digite..." />
      <Button>Enviar</Button>
    </div>
  );
}
```

### Overlay / Navegação

- `dialog.tsx`: `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogClose`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
- `alert-dialog.tsx`: `AlertDialog`, `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`
- `popover.tsx`: `Popover`, `PopoverTrigger`, `PopoverContent`
- `sheet.tsx`: `Sheet`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`
- `drawer.tsx`: `Drawer`, `DrawerPortal`, `DrawerOverlay`, `DrawerTrigger`, `DrawerClose`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`, `DrawerTitle`, `DrawerDescription`
- `tooltip.tsx`: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- `navigation-menu.tsx`: `navigationMenuTriggerStyle`, `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuContent`, `NavigationMenuTrigger`, `NavigationMenuLink`, `NavigationMenuIndicator`, `NavigationMenuViewport`
- `breadcrumb.tsx`: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`
- `pagination.tsx`: `Pagination`, `PaginationContent`, `PaginationEllipsis`, `PaginationItem`, `PaginationLink`, `PaginationNext`, `PaginationPrevious`
- `sidebar.tsx`: `Sidebar`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarInput`, `SidebarInset`, `SidebarMenu`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarProvider`, `SidebarRail`, `SidebarSeparator`, `SidebarTrigger`, `useSidebar`

### Menus / Comandos

- `dropdown-menu.tsx`: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuRadioGroup`
- `context-menu.tsx`: `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuGroup`, `ContextMenuPortal`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuRadioGroup`
- `menubar.tsx`: `Menubar`, `MenubarMenu`, `MenubarTrigger`, `MenubarContent`, `MenubarItem`, `MenubarSeparator`, `MenubarLabel`, `MenubarCheckboxItem`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarPortal`, `MenubarSubContent`, `MenubarSubTrigger`, `MenubarGroup`, `MenubarSub`, `MenubarShortcut`
- `command.tsx`: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`

### Layout / Visual

- `card.tsx`: `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`
- `badge.tsx`: `Badge`, `badgeVariants`, `BadgeProps`
- `separator.tsx`: `Separator`
- `aspect-ratio.tsx`: `AspectRatio`
- `scroll-area.tsx`: `ScrollArea`, `ScrollBar`
- `collapsible.tsx`: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- `accordion.tsx`: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- `tabs.tsx`: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `progress.tsx`: `Progress`
- `skeleton.tsx`: `Skeleton`
- `avatar.tsx`: `Avatar`, `AvatarImage`, `AvatarFallback`
- `resizable.tsx`: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`
- `carousel.tsx`: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`, `CarouselApi`
- `table.tsx`: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`
- `chart.tsx`: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`, `ChartConfig`

### Alertas / Toast

- `alert.tsx`: `Alert`, `AlertTitle`, `AlertDescription`
- `toast.tsx`: `ToastProvider`, `ToastViewport`, `Toast`, `ToastTitle`, `ToastDescription`, `ToastClose`, `ToastAction`, `ToastProps`, `ToastActionElement`
- `toaster.tsx`: `Toaster` (renderiza os toasts do `useToast`)
- `sonner.tsx`: `Toaster`, `toast` (integração com a lib `sonner`)
- `use-toast.ts`: `useToast`, `toast` (reexport do hook em `src/hooks/use-toast.ts`)

---

## Frontend — Entrypoints / Páginas (exports default)

### `App` — `src/App.tsx` (default export)

Responsável por:

- `QueryClientProvider` (React Query)
- `TooltipProvider`
- `Toaster` (shadcn)
- `Sonner` (sonner)
- `BrowserRouter` e rotas:
  - `/` → `Index`
  - `*` → `NotFound`

### `Index` — `src/pages/Index.tsx` (default export)

Página principal: faz a busca via `scrapeProperties`, mantém seleção e aplica filtro de preço.

### `NotFound` — `src/pages/NotFound.tsx` (default export)

Página 404 simples.

