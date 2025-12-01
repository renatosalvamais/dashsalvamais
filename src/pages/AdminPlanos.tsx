import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Check, X, Trash2, ChevronUp, ChevronDown, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useReorderProducts, Product } from "@/hooks/useProducts";

export default function AdminPlanos() {
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const reorderProducts = useReorderProducts();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "" });
  const { toast } = useToast();

  const handleExportProducts = () => {
    try {
      if (!products || products.length === 0) {
        toast({ description: "Nenhum produto para exportar.", variant: "destructive" });
        return;
      }
      const header = ["Nome", "Preço", "Ordem"];
      const escape = (v: any) => {
        const s = v == null ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };
      const lines = products.map((p) => [
        escape(p.name),
        escape(p.price.toFixed(2).replace('.', ',')),
        escape((p.display_order ?? 0).toString()),
      ].join(";"));
      const csv = [header.join(";"), ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "planos_produtos.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ description: "Exportação concluída!" });
    } catch (err: any) {
      toast({ description: "Falha ao exportar: " + (err?.message || String(err)), variant: "destructive" });
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValue(product.price.toString());
  };

  const saveEdit = (id: string) => {
    const priceValue = parseFloat(editValue.replace(',', '.'));
    updateProduct.mutate({ id, price: priceValue });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.name.trim()) {
      toast({ description: "Nome do produto é obrigatório", variant: "destructive" });
      return;
    }
    
    if (!newProduct.price || !newProduct.price.trim()) {
      toast({ description: "Preço é obrigatório", variant: "destructive" });
      return;
    }
    
    const priceValue = parseFloat(newProduct.price.replace(',', '.'));
    
    if (isNaN(priceValue)) {
      toast({ description: "Preço inválido", variant: "destructive" });
      return;
    }
    
    const maxOrder = products.length > 0 ? Math.max(...products.map(p => p.display_order || 0)) : 0;
    
    createProduct.mutate({ 
      name: newProduct.name, 
      price: priceValue,
      display_order: maxOrder + 1
    }, {
      onSuccess: () => {
        setNewProduct({ name: "", price: "" });
        setShowNewProduct(false);
      }
    });
  };

  const removeProduct = (id: string) => {
    deleteProduct.mutate(id);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newProducts = [...products];
    [newProducts[index - 1], newProducts[index]] = [newProducts[index], newProducts[index - 1]];
    reorderProducts.mutate(newProducts);
  };

  const moveDown = (index: number) => {
    if (index === products.length - 1) return;
    const newProducts = [...products];
    [newProducts[index + 1], newProducts[index]] = [newProducts[index], newProducts[index + 1]];
    reorderProducts.mutate(newProducts);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <div className="flex gap-2">
            <Button onClick={handleExportProducts} size="sm" variant="outline">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={() => setShowNewProduct(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Produto
            </Button>
          </div>
        </div>

        {showNewProduct && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Novo Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome do Produto</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Nome do produto"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Preço (R$)</Label>
                  <Input
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0,00"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={addProduct} size="sm">
                  <Check className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setShowNewProduct(false);
                  setNewProduct({ name: "", price: "" });
                }}>
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Preços Unitários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {products.map((product, index) => (
                <Card
                  key={product.id}
                  className="border border-border hover:border-primary/50 transition-colors"
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm text-foreground line-clamp-2">
                          {product.name}
                        </span>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => moveDown(index)}
                            disabled={index === products.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {editingId === product.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-7 text-sm flex-1"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="text-base font-semibold text-primary">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </div>
                      )}

                      <div className="flex gap-1">
                        {editingId === product.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 flex-1 text-xs"
                              onClick={() => saveEdit(product.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 flex-1 text-xs"
                              onClick={cancelEdit}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 flex-1 text-xs"
                              onClick={() => startEdit(product)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 flex-1 text-xs text-destructive hover:text-destructive"
                              onClick={() => removeProduct(product.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remover
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
