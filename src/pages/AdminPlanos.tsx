import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Check, X, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: string;
}

const initialProducts: Product[] = [
  { id: "1", name: "Plano Básico", price: "39,90" },
  { id: "2", name: "Plano Básico Familiar", price: "69,90" },
  { id: "3", name: "Plano Intermediário", price: "49,90" },
  { id: "4", name: "Plano Intermediário Familiar", price: "79,90" },
  { id: "5", name: "Plano Avançado", price: "59,90" },
  { id: "6", name: "Plano Avançado Familiar", price: "89,90" },
  { id: "7", name: "ePharma (50)", price: "0,00" },
  { id: "8", name: "ePharma (100)", price: "9,90" },
  { id: "9", name: "ePharma (150)", price: "14,90" },
  { id: "10", name: "TotalPass1", price: "19,90" },
  { id: "11", name: "TotalPass2", price: "14,90" },
  { id: "12", name: "TotalPass3", price: "12,90" },
  { id: "13", name: "Ubook", price: "1,00" },
  { id: "14", name: "Braslivros", price: "1,00" },
];

export default function AdminPlanos() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "" });
  const { toast } = useToast();

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValue(product.price);
  };

  const saveEdit = (id: string) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, price: editValue } : p
    ));
    setEditingId(null);
    toast({
      title: "Preço atualizado",
      description: "O preço foi atualizado com sucesso.",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const addProduct = () => {
    if (newProduct.name && newProduct.price) {
      const newId = (Math.max(...products.map(p => parseInt(p.id))) + 1).toString();
      setProducts([...products, { id: newId, ...newProduct }]);
      setNewProduct({ name: "", price: "" });
      setShowNewProduct(false);
      toast({
        title: "Produto adicionado",
        description: "O novo produto foi adicionado com sucesso.",
      });
    }
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({
      title: "Produto removido",
      description: "O produto foi removido com sucesso.",
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newProducts = [...products];
    [newProducts[index - 1], newProducts[index]] = [newProducts[index], newProducts[index - 1]];
    setProducts(newProducts);
  };

  const moveDown = (index: number) => {
    if (index === products.length - 1) return;
    const newProducts = [...products];
    [newProducts[index + 1], newProducts[index]] = [newProducts[index], newProducts[index + 1]];
    setProducts(newProducts);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <Button onClick={() => setShowNewProduct(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Produto
          </Button>
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
                          R$ {product.price}
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
