import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Check, X } from "lucide-react";
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Planos</h1>
          <Button onClick={() => setShowNewProduct(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Produto
          </Button>
        </div>

        {showNewProduct && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Novo Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Produto</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Nome do produto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={addProduct}>
                  <Check className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowNewProduct(false);
                  setNewProduct({ name: "", price: "" });
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Preços Unitários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground">{product.name}</span>
                  <div className="flex items-center gap-2">
                    {editingId === product.id ? (
                      <>
                        <span className="text-muted-foreground">R$</span>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveEdit(product.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-primary">
                          R$ {product.price}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
