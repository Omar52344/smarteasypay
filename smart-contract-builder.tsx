"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, PanInfo } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Wallet, Plus, Settings, Copy, Trash2, Calendar, DollarSign, Clock, Save, Play,ReceiptText,ArrowLeft,CornerDownRight,Check } from "lucide-react"
import { noSSR } from "next/dynamic"
import { set } from "date-fns"
import { toast,Toaster } from "sonner"
//import { ethers } from 'ethers'

interface ExitCondition {
id: string // ID único de la condición de salida
value:number
order: number // Orden de la condición en el flujo
walletId: string // ID de la billetera asociada a esta condición
}
  

interface Condition {
  idWallet?: string,
  //order?: number,//posicion relativa de izquierda a derecha
  id: string// id unico de la condicion
  type: "date" | "amount" | "expiration"//tipo de comparacion
  operator: "equals" | "greater" | "less" | "between" //operador
  value: string | number//valor condicion
  value2?: string | number//valor 2 de condicion
  label: string//nonbre de condicion
  //groupCondition?: number//grupo de la condicion para hacer agrupamiento anidad
  logic: "AND" | "OR"//logic de la condicion
  //logicGroup?: "AND" | "OR"//logica del grupo de la condicion
  //nivelCondicion?: number
  conditions: Condition[]//condiciones anidadas,
  nivel: number//nivel de anidamiento de la condicion
  exitConditions: ExitCondition[]//condiciones de salida
}

interface WalletNode {
  id: string
  name: string
  address: string
  x: number
  y: number
  condition: Condition
  //logic: "AND" | "OR"
  parentId?: string
  children: string[]
  color: string
  idPerson?: string
  Document?: string
  verifiedWallet?: boolean
  Metadada?: any[],
  valid?: boolean
}

const conditionTypes = [
  { value: "date", label: "Fecha", icon: Calendar, color: "bg-blue-500" },
  { value: "amount", label: "Monto", icon: DollarSign, color: "bg-green-500" },
  { value: "expiration", label: "Expiración", icon: Clock, color: "bg-red-500" },
]

const operators = {
  date: [
    { value: "equals", label: "En fecha exacta" },
    { value: "greater", label: "Después de" },
    { value: "less", label: "Antes de" },
    { value: "between", label: "Entre fechas" },
  ],
  amount: [
    { value: "equals", label: "Igual a" },
    { value: "greater", label: "Mayor que" },
    { value: "less", label: "Menor que" },
    { value: "between", label: "Entre montos" },
  ],
  expiration: [
    { value: "equals", label: "Expira en" },
    { value: "greater", label: "Expira después de" },
    { value: "less", label: "Expira antes de" },
  ],
}

export default function SmartContractBuilder() {
  const [nodes, setNodes] = useState<WalletNode[]>([
    {
      id: crypto.randomUUID(),
      name: "Billetera Principal",
      address: "0x1234...5678",
      x: 400,
      y: 100,
      condition: {
        id: crypto.randomUUID(),
        type: "date",
        operator: "equals",
        value: "",
        label: "Nueva condición",
        conditions: [],
        nivel: 1,
        logic: "AND",
        exitConditions: [{
          id: crypto.randomUUID(),
          value: 0,
          order: 1,
          walletId: "", // ID de la billetera asociada
        }],
      },
      children: [],
      color: "bg-purple-500",
    },
  ])
  const nodesRef = useRef(nodes)
  const [simulateActive, setSimulate] = useState(false)
  const [selectedNode, setSelectedNode] = useState<WalletNode|null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [validNodes, setValidNodes] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSelectingExit, setIsSelectingExit] = useState(false)
  const[selectedExit, setSelectedExit] = useState<ExitCondition[]>(
    [{
      id: crypto.randomUUID(),
      value: 0,
      order: 1,
      walletId: "", // ID de la billetera asociada
    }],
  )

  const [selectedCondition, setSelectedCondition] = useState<Condition>( {
      id: crypto.randomUUID(),
      type: "date",
      operator: "equals",
      value: "",
      label: "Nueva condición",
      conditions: [],
      nivel:1,
      logic: "AND",
      exitConditions: [{
          id: crypto.randomUUID(),
          value: 0,
          order: 1,
          walletId: "", // ID de la billetera asociada
        }],
    })
  const [connectionStart, setConnectionStart] = useState<string | null>(null)
  const [tempConnection, setTempConnection] = useState<{
    from: { x: number; y: number }
    to: { x: number; y: number }
  } | null>(null)
  const [left, setLeft] = useState(320)
  const [top, setTop] = useState(89)
  const addNode = useCallback(() => {
    const newNode: WalletNode = {
      id: crypto.randomUUID(),
      name: `Billetera ${nodes.length + 1}`,
      address: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
      x: 200 + Math.random() * 400,
      y: 200 + Math.random() * 200,
      condition:  {
        id: crypto.randomUUID(),
        type: "date",
        operator: "equals",
        value: "",
        label: "Nueva condición",
        conditions: [],
        nivel:1,
        logic: "AND",
        exitConditions: [{
          id: crypto.randomUUID(),
          value: 0,
          order: 1,
          walletId: "", // ID de la billetera asociada
        }],
      },
      children: [],
      color: `bg-${["blue", "green", "red", "purple"][Math.floor(Math.random() * 4)]}-500`,
    }
    setNodes((prev) => [...prev, newNode])
  }, [nodes.length])

  const updateNode = useCallback((nodeId: string, updates: Partial<WalletNode>) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)))
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId))
  }, [])

  const cloneNode = useCallback(
    (nodeId: string) => {
      const nodeToClone = nodes.find((n) => n.id === nodeId)
      if (nodeToClone) {
        const clonedNode: WalletNode = {
          ...nodeToClone,
          id: Date.now().toString(),
          name: `${nodeToClone.name} (Copia)`,
          x: nodeToClone.x + 50,
          y: nodeToClone.y + 50,
          children: [],
        }
        setNodes((prev) => [...prev, clonedNode])
      }
    },
    [nodes],
  )
const addCondition = useCallback(
  (nodeId: string, conditionId: string,conditionLevel:number) => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      type: "date",
      operator: "equals",
      value: "",
      label: "Nueva condición",
      conditions: [],
      nivel: conditionLevel +1 ,// Incrementar el nivel de anidamiento
      logic: "AND", // Lógica por defecto
      exitConditions: [{
          id: crypto.randomUUID(),
          value: 0,
          order: 1,
          walletId: "", // ID de la billetera asociada
        }],
    };

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              condition: addConditionToTree(node.condition, conditionId, newCondition),
            }
          : node
      )
    );
  },
  []
);

function addConditionToTree(
  condition: Condition,
  conditionId: string,
  newCondition: Condition
): Condition {
  if (condition.id === conditionId) {
    return {
      ...condition,
      conditions: [...condition.conditions, newCondition],
    };
  }

  const updatedChildren = condition.conditions.map((child) =>
    addConditionToTree(child, conditionId, newCondition)
  );

  return { ...condition, conditions: updatedChildren };
}


useEffect(() => {
  if (selectedNode && selectedCondition) {
    const refreshed = findConditionById(selectedNode.condition, selectedCondition.id);
     setSelectedCondition(selectedNode.condition);
    if (refreshed) {
      
      setSelectedCondition(refreshed);
    }
  }
}, [selectedNode]);

const updateCondition = useCallback(
  (nodeId: string, conditionId: string, updates: Partial<Condition>) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const updatedCondition = updateConditionTree(node.condition, conditionId, updates);
      updateNode(nodeId, { condition: updatedCondition });
    }
  },
  [nodes, updateNode]
);

const removeCondition = useCallback(
  (nodeId: string, conditionId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const updatedCondition = removeConditionTree(node.condition, conditionId);
      
      // Solo actualiza si no se eliminó la raíz completa
      if (updatedCondition) {
        updateNode(nodeId, { condition: updatedCondition });
      } else {
        // Si la raíz fue eliminada (el id eliminado es el root), podrías decidir qué hacer
        // Aquí un ejemplo asignando una condición vacía:
        updateNode(nodeId, {
          condition: {
            id: crypto.randomUUID(),
            type: 'amount',
            operator: 'equals',
            value: '',
            label: '',
            conditions: [],
            nivel: 1, // Nivel inicial
            logic: 'AND', // Lógica por defecto
            exitConditions: [{
            id: crypto.randomUUID(),
            value: 0,
            order: 1,
            walletId: "", // ID de la billetera asociada
          }],
          },
        });
      }
    }
  },
  [nodes, updateNode]
);

 const startConnection = useCallback((nodeId: string) => {
    setConnectionStart(nodeId)
    setIsConnecting(true)
  }, [])
  const completeConnection = useCallback(
    (targetNodeId: string) => {
      if (connectionStart && connectionStart !== targetNodeId) {
        // Prevenir conexiones circulares
        const wouldCreateCycle = (parentId: string, childId: string): boolean => {
          const checkCycle = (currentId: string, targetId: string): boolean => {
            if (currentId === targetId) return true
            const currentNode = nodes.find((n) => n.id === currentId)
            return currentNode?.children.some((childId) => checkCycle(childId, targetId)) || false
          }
          return checkCycle(childId, parentId)
        }

        if (!wouldCreateCycle(connectionStart, targetNodeId)) {
          // Actualizar el nodo padre para incluir el hijo
          updateNode(connectionStart, {
            children: [...(nodes.find((n) => n.id === connectionStart)?.children || []), targetNodeId],
          })

          // Actualizar el nodo hijo para tener el padre
          updateNode(targetNodeId, { parentId: connectionStart })
        }
      }

      setConnectionStart(null)
      setIsConnecting(false)
      setTempConnection(null)
    },
    [connectionStart, nodes, updateNode],
  )

  const removeConnection = useCallback((parentId: string, childId: string) => {
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.id === parentId) {
          // Remover hijo del padre
          return {
            ...node,
            children: node.children.filter((id) => id !== childId),
          }
        } else if (node.id === childId) {
          // Remover padre del hijo
          return {
            ...node,
            parentId: undefined,
          }
        }
        return node
      })
    })
  }, [])

  const cancelConnection = useCallback(() => {
    setConnectionStart(null)
    setIsConnecting(false)
    setTempConnection(null)
  }, [])

  const handleNodeDrag = useCallback(
    (nodeId: string, info: MouseEvent) => {
        const x = info.clientX - left
        const y = info.clientY - top
        setNodes((prevNodes) => prevNodes.map((node) => (node.id === nodeId ? { ...node, x, y } : node)))
    },
    [isConnecting, connectionStart, tempConnection],
  )

  const getConditionIcon = (type: string) => {
    const conditionType = conditionTypes.find((ct) => ct.value === type)
    return conditionType ? conditionType.icon : Calendar
  }

  const getConditionColor = (type: string) => {
    const conditionType = conditionTypes.find((ct) => ct.value === type)
    return conditionType ? conditionType.color : "bg-gray-500"
  }

  useEffect(() => {
    nodesRef.current = nodes
    if (!isConnecting || !connectionStart) return

    const handleMouseMove = (e: MouseEvent) => {
      //if (canvasRef.current) {
        //const rect = canvasRef.current.getBoundingClientRect()
        const startNode = nodes.find((n) => n.id === connectionStart)
        if (startNode) {
          // Calcular punto de salida más cercano al mouse
          const mouseX = e.clientX - left
          const mouseY = e.clientY - top
          const nodeCenterX = startNode.x + 48
          const nodeCenterY = startNode.y + 48

          let startX, startY
          const deltaX = mouseX - nodeCenterX
          const deltaY = mouseY - nodeCenterY
          const angle = Math.atan2(deltaY, deltaX)
          const absAngle = Math.abs(angle)

          if (absAngle < Math.PI / 4) {
            startX = startNode.x + 96
            startY = nodeCenterY
          } else if (absAngle > (3 * Math.PI) / 4) {
            startX = startNode.x
            startY = nodeCenterY
          } else if (angle > 0) {
            startX = nodeCenterX
            startY = startNode.y + 96
          } else {
            startX = nodeCenterX
            startY = startNode.y
          }
          //console.log(mouseX,mouseY,'mouse posicion')
          setTempConnection({
            from: { x: startX, y: startY },
            to: { x: mouseX, y: mouseY },
          })
        }
      //}
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [isConnecting, connectionStart, nodes])

  useEffect(() => {
    if (selectedNode) {
      const updatedNode = nodes.find((n) => n.id === selectedNode.id);
      if (updatedNode) {
          setSelectedNode(updatedNode);
      }
    }
  }, [nodes, selectedNode]);


  useEffect(() => {
    const interval = setInterval(() => {
      //console.log(nodesRef.current, 'nodos')
      sessionStorage.setItem('wallets', JSON.stringify(nodesRef.current))
    }, 10000) // cada 10 segundos

    return () => clearInterval(interval) // limpia el intervalo al desmontar
  }, [])

  ///este el use efect que se supone que debe consultar en la base de datos si tiene valor 
  // si tiene valor monta el valor sino intenta montar el del session storage
  useEffect(() => {
    var Nodes = sessionStorage.getItem('wallets')
    if (Nodes) {
      setNodes(JSON.parse(Nodes))
    }
  }, [])

  const simulate = useCallback(() => {
    // Encuentra todos los nodos inválidos
    const invalidNodes = nodes.filter(element => !element.valid);

    if (invalidNodes.length > 0) {
      // Aquí puedes mostrar un mensaje, marcar los nodos, etc.
      // ...
      toast.error(`Hay ${invalidNodes.length} nodos con billeteras inválidas.`, {
        description: "Por favor revisa las billeteras marcadas antes de continuar.",
      })
      //alert(`Hay ${invalidNodes.length} nodos con billeteras inválidas. Por favor revisa las billeteras marcadas antes de continuar.`)
      setSimulate(true)
      return;
    }else{
        setValidNodes(true)
        setSimulate(true)
        //llamar el metodo que simula el flujo de fondos
    }
  }, [nodes]);

  /*async function checkExistencia(address: string) {
  try {
    const balance = await provider.getBalance(address)
    const txCount = await provider.getTransactionCount(address)

    const existe = !balance.isZero() || txCount > 0
    console.log(`¿Existe?: ${existe}`)
    return existe
  } catch (err) {
    console.error('Dirección inválida o error de red', err)
    return false
  }
}*/
function updateConditionTree(
  condition: Condition,
  conditionId: string,
  updates: Partial<Condition>
): Condition {
  // Si esta condición es la que buscamos, la actualizamos
  const updatedSelf = condition.id === conditionId
    ? { ...condition, ...updates }
    : condition;

  // Luego actualizamos recursivamente las condiciones hijas
  const updatedChildren = updatedSelf.conditions.map(child =>
    updateConditionTree(child, conditionId, updates)
  );

  return { ...updatedSelf, conditions: updatedChildren };

}

function removeConditionTree(condition: Condition, conditionId: string): Condition | null {
  // Si esta condición es la que se quiere eliminar, devolvemos null
  if (condition.id === conditionId) {
    return null;
  }

  // Filtrar y limpiar hijos
  const filteredChildren = condition.conditions
    .map(child => removeConditionTree(child, conditionId))
    .filter(Boolean) as Condition[];

  return { ...condition, conditions: filteredChildren };
}

const selectChildrenCondition = (condition: Condition)=> {
  if (!condition || !condition.conditions) {
    return []
  }
  //console.log(node, 'seleccionando hijos')
  setSelectedCondition(condition)
  
 
}

const selectParentCondition = (
  root: Condition,
  target: Condition,
  setSelectedCondition: (condition: Condition) => void
): boolean => {
  for (const child of root.conditions) {
    if (child.id === target.id) {

      setSelectedCondition(root);

      return true; // corta la recursión
    }

    const found = selectParentCondition(child, target, setSelectedCondition);
    if (found) return true;
  }

  return false;
};

  function conditionExists(root: Condition, targetId: string): boolean {
    if (root.id === targetId) return true;
    return root.conditions.some(child => conditionExists(child, targetId));
  }

  function findConditionById(root: Condition, id: string): Condition | null {
    if (root.id === id) return root;
    for (const child of root.conditions) {
      const found = findConditionById(child, id);
      if (found) return found;
    }
    return null;
  }
function updateExitConditionsInTree(
  root: Condition,
  targetId: string,
  newExitConditions: ExitCondition[]
): Condition {
  if (root.id === targetId) {
    return {
      ...root,
      exitConditions: newExitConditions,
    };
  }

  return {
    ...root,
    conditions: root.conditions.map((child) =>
      updateExitConditionsInTree(child, targetId, newExitConditions)
    ),
  };
}

const updateExitConditions = useCallback(
  (nodeId: string, conditionId: string, newExitConditions: ExitCondition[]) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              condition: updateExitConditionsInTree(node.condition, conditionId, newExitConditions),
            }
          : node
      )
    );
  },
  []
);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
       <Toaster richColors />
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Constructor de Contratos Inteligentes</h1>
          <p className="text-gray-600">Diseña la lógica de flujo de fondos mediante nodos conectados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addNode} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Billetera
          </Button>
          <Button
            onClick={() => setIsConnecting(!isConnecting)}
            variant={isConnecting ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {isConnecting ? "Cancelar Conexión" : "Conectar Billeteras"}
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Guardar
          </Button>
          <Button variant="outline" className="flex items-center gap-2"
            onClick={simulate}
          >
            <Play className="w-4 h-4" />
            Simular
          </Button>

            {validNodes && (
            <Button variant="outline" className="flex items-center gap-2"
 
            >
              <DollarSign className="w-4 h-4" />
              Firmar
            </Button>
            )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Jerarquía de Billeteras</h3>
              <div className="space-y-2">
                {nodes
                  .filter((node) => !node.parentId)
                  .map((rootNode) => (
                    <div key={rootNode.id} className="space-y-1">
                      <Card
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedNode?.id === rootNode.id ? "ring-2 ring-blue-500" : ""}`}
                        onClick={() => setSelectedNode(rootNode)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${rootNode.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{rootNode.name}</p>
                            <p className="text-xs text-gray-500 truncate">{rootNode.address}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {
                            rootNode.condition?.conditions.length
                            //console.log(rootNode, 'condiciones')
                            }
                          </Badge>
                          {
                            //console.log(rootNode, 'condiciones')
                          }
                        </div>
                      </Card>

                      {/* Render children recursively */}
                      {rootNode.children.map((childId) => {
                        const childNode = nodes.find((n) => n.id === childId)
                        if (!childNode) return null

                        return (
                          <div key={childId} className="ml-6 relative">
                            <div className="absolute -left-3 top-0 bottom-0 w-px bg-gray-300"></div>
                            <div className="absolute -left-3 top-4 w-3 h-px bg-gray-300"></div>
                            <Card
                              className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedNode?.id === childNode.id ? "ring-2 ring-blue-500" : ""}`}
                              onClick={() => setSelectedNode(childNode)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${childNode.color}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{childNode.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{childNode.address}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {childNode.condition?.conditions.length}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="w-6 h-6 p-0 text-red-500 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeConnection(rootNode.id, childId)
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </Card>
                          </div>
                        )
                      })}
                    </div>
                  ))}

                {/* Nodos huérfanos */}
                {nodes.filter((node) => node.parentId && !nodes.find((n) => n.children.includes(node.id))).length >
                  0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Billeteras sin conexión</h4>
                      {nodes
                        .filter((node) => node.parentId && !nodes.find((n) => n.children.includes(node.id)))
                        .map((orphanNode) => (
                          <Card
                            key={orphanNode.id}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-dashed ${selectedNode?.id === orphanNode.id ? "ring-2 ring-blue-500" : ""}`}
                            onClick={() => setSelectedNode(orphanNode)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${orphanNode.color}`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{orphanNode.name}</p>
                                <p className="text-xs text-gray-500 truncate">{orphanNode.address}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {orphanNode.condition?.conditions.length}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                    </div>
                  )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Contratos</h3>
              <div className="space-y-2">
                {conditionTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <div key={type.value} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                      {/*<div className={`w-8 h-8 rounded-full ${type.color} flex items-center justify-center`}>*/}
                        {/*<Icon className="w-4 h-4 text-white" />*/}
                      {/*</div>*/}
                      {/*<span className="text-sm font-medium">{type.label}</span>*/}
                    </div>
                  
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden" ref={canvasRef}>
          <div
            className="absolute inset-0 bg-gray-100"
            style={{
              backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
              </defs>

              {nodes.map((node) =>
                node.children.map((childId) => {
                  let pathData = ""
                  let midX = 0, midY = 0
                  let startX = 0, startY = 0
                  const childNode = nodes.find((n) => n.id === childId)
                  if (!childNode) return null
                  //if (canvasRef.current) {
                  //const rect = canvasRef.current.getBoundingClientRect()
                  const startNode = nodes.find((n) => n.id === node.id)
                  if (startNode) {
                    // Calcular punto de salida más cercano al mouse
                    const childX = childNode.x//- rect.left
                    const childY = childNode.y //- rect.top
                    const nodeCenterX = startNode.x + 48
                    const nodeCenterY = startNode.y + 48
                    const deltaX = childX - nodeCenterX
                    const deltaY = childY - nodeCenterY
                    const angle = Math.atan2(deltaY, deltaX)
                    const absAngle = Math.abs(angle)

                    if (absAngle < Math.PI / 4) {
                      startX = startNode.x + 96
                      startY = nodeCenterY
                    } else if (absAngle > (3 * Math.PI) / 4) {
                      startX = startNode.x
                      startY = nodeCenterY
                    } else if (angle > 0) {
                      startX = nodeCenterX
                      startY = startNode.y + 96
                    } else {
                      startX = nodeCenterX
                      startY = startNode.y
                    }
                    const nodeSize = 96
                    const nodeRadius = nodeSize / 2

                    const childCenterX = childNode.x + nodeRadius
                    const childCenterY = childNode.y + nodeRadius

                    const parentCenterX = node.x + nodeRadius
                    const parentCenterY = node.y + nodeRadius

                    const dx = childCenterX - parentCenterX
                    const dy = childCenterY - parentCenterY
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    const unitX = dx / distance
                    const unitY = dy / distance
                    const endX = childCenterX - unitX * nodeRadius
                    const endY = childCenterY - unitY * nodeRadius

                    midX = (startX + endX) / 2
                    midY = (startY + endY) / 2

                    pathData = `M ${startX} ${startY} L ${childX} ${childY}`
                  }


                  return (
                    <g key={`${node.id}-${childId}`}>
                      {/* Línea principal */}
                      <path
                        d={pathData}
                        stroke="#3b82f6"
                        strokeWidth="3"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                        className="drop-shadow-sm"
                      />

                      {/* Área clickeable invisible para eliminar conexión */}
                      <path
                        d={pathData}
                        stroke="transparent"
                        strokeWidth="12"
                        fill="none"
                        className="cursor-pointer pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeConnection(node.id, childId)
                        }}
                      />

                      {/* Botón de eliminar en el punto medio */}
                      <g transform={`translate(${midX}, ${midY})`} className="pointer-events-auto">
                        <circle
                          cx="0"
                          cy="0"
                          r="12"
                          fill="#ffffff"
                          stroke="#ef4444"
                          strokeWidth="2"
                          className="cursor-pointer hover:fill-red-50 drop-shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeConnection(node.id, childId)
                          }}
                        />
                        <text
                          textAnchor="middle"
                          dy="1"
                          className="text-xs fill-red-500 font-bold cursor-pointer select-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeConnection(node.id, childId)
                          }}
                        >
                          ×
                        </text>
                      </g>

                      {/* Etiqueta de flujo */}
                      <g transform={`translate(${midX}, ${midY - 25})`}>
                        <rect
                          x="-15"
                          y="-8"
                          width="30"
                          height="16"
                          rx="8"
                          fill="#ffffff"
                          stroke="#3b82f6"
                          strokeWidth="1"
                          opacity="0.95"
                          className="drop-shadow-sm"
                        />
                        <text textAnchor="middle" dy="4" className="text-xs fill-blue-600 font-medium">
                          💰
                        </text>
                      </g>
                    </g>
                  )
                }),
              )}

              {/* Temporary connection line while connecting */}
              {tempConnection && (
                <g>
                  <path
                    d={`M ${tempConnection.from.x} ${tempConnection.from.y} L ${tempConnection.to.x} ${tempConnection.to.y}`}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    opacity="0.8"
                  />
                  <circle
                    cx={tempConnection.from.x}
                    cy={tempConnection.from.y}
                    r="6"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                </g>
              )}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                drag={!isConnecting}
                dragMomentum={false}
                onDrag={(event: MouseEvent, info: PanInfo) => {
                  if (!isConnecting) {
                    handleNodeDrag(node.id, event)
                  }
                }}
                className={`absolute ${isConnecting ? "cursor-crosshair" : "cursor-move"}`}
                style={{ left: node.x, top: node.y }}
                whileHover={{ scale: isConnecting ? 1.1 : 1.05 }}
                whileDrag={{ scale: 1.1, zIndex: 1000 }}
                onClick={() => {
                  if (isConnecting) {
                    if (connectionStart === null) {
                      startConnection(node.id)
                    } else {
                      completeConnection(node.id)
                    }
                  }
                }}
              >
                <Card
                  className={`w-24 h-24 p-0 shadow-lg border-2 transition-colors ${isConnecting
                    ? connectionStart === node.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-green-400 hover:border-green-500"
                    : "hover:border-blue-400"
                    }`}
                >
                  <CardContent className="p-2 h-full flex flex-col items-center justify-center relative">
                    <div className={`w-8 h-8 rounded-full ${node.color} flex items-center justify-center mb-1`}>
                      <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs font-medium text-center leading-tight">{node.name}</p>

                    {/* Connection indicator */}
                    {isConnecting && connectionStart === node.id && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    )}

                    {/* Parent/Child indicators */}
                    {node.parentId && (
                      <div className="absolute -top-2 -left-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    {node.children.length > 0 && (
                      <div className="absolute -bottom-2 -right-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">{node.children.length}</span>
                        </div>
                      </div>
                    )}
                     
                    {node.valid ? (
                      <div className="absolute top-1 left-1">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-1 left-1">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </span>
                      </div>
                    )}

                    {/* Existing condition indicators... */}
                    {node.condition?.conditions.length > 0 && (

                      
                      <div className="absolute top-0 right-0 flex gap-1">
                        {node.condition?.conditions.slice(0, 3).map((condition, idx) => {
                          const Icon = getConditionIcon(condition.type)
                          return (
                            <div
                              key={idx}
                              className={`w-4 h-4 rounded-full ${getConditionColor(condition.type)} flex items-center justify-center`}
                            >
                              <Icon className="w-2 h-2 text-white" />
                            </div>
                          )
                        })}
                        {node.condition?.conditions.length > 3 && (
                          <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center">
                            <span className="text-xs text-white">+</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Logic indicator */}
                    {/*{node.condition?.conditions.length > 1 && (
                      <div className="absolute bottom-0 left-0">
                        <Badge variant={node.logic === "AND" ? "default" : "secondary"} className="text-xs px-1 py-0">
                          {node.logic}
                        </Badge>
                      </div>
                    )}*/}
                  </CardContent>
                </Card>

                {/* Node Actions */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                  <Dialog
                    open={isConfigOpen && selectedNode?.id === node.id}
                    onOpenChange={(open) => {
                      setIsConfigOpen(open)
                      if (open) setSelectedNode(node)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="w-6 h-6 p-0">
                        <Settings className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  <Button size="sm" variant="outline" className="w-6 h-6 p-0" onClick={() => cloneNode(node.id)}>
                    <Copy className="w-3 h-3" />
                  </Button>

                  <Button size="sm" variant="outline" className="w-6 h-6 p-0" onClick={() => deleteNode(node.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {/* Connection Help */}
        {isConnecting && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-100 border border-blue-300 rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-blue-900">
                  {connectionStart ? "Selecciona la billetera destino" : "Selecciona la billetera origen"}
                </p>
                <p className="text-sm text-blue-700">
                  {connectionStart
                    ? "Haz clic en la billetera que recibirá los fondos"
                    : "Haz clic en la billetera que enviará los fondos"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={cancelConnection}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={(open) => {
        setIsConfigOpen(open);
        // Update selectedNode when dialog opens to ensure latest state
        if (open && selectedNode) {
          const updatedNode = nodes.find(n => n.id === selectedNode.id);
          setSelectedNode(updatedNode || null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Billetera: {selectedNode?.name}</DialogTitle>
          </DialogHeader>

          {selectedNode && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Billetera</Label>
                  <Input
                    id="name"
                    value={selectedNode.name}
                    onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={selectedNode.address}
                    onChange={(e) => updateNode(selectedNode.id, { address: e.target.value })}
                  />
                </div>
              </div>

                <Separator />

                {/* Botón Validar Billetera */}
                <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={async () => {
                  // Validación simple: dirección empieza con '0x' y tiene longitud 42
                  if (selectedNode?.address && selectedNode.address.startsWith('0x') && selectedNode.address.length === 42) {
                    //aqui ira funcion de validacion con el api si es necesario
                    updateNode(selectedNode.id, { valid: true });
                    toast.success("Billetera válida");
                  } else {
                    updateNode(selectedNode.id, { valid: false });
                    toast.error("Dirección de billetera inválida");
                  }
                  }}
                >
                  Validar Billetera
                </Button>
                </div>

                {/* Color Selection */}

              <Separator />

              {/* Logic Type */}
              { selectedCondition?.conditions?.length >= 1 && (
                <div className="space-y-2">
                  <Label>Lógica de Condiciones</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedCondition.logic === "AND"}
                        onCheckedChange={(checked) => updateCondition(selectedNode.id, selectedCondition.id, { logic: checked ? "AND" : "OR" })
                      } 
                      />
                      <Label className="text-sm">
                        {selectedCondition.logic === "AND" ? "condiciones (AND)" : "condición (OR)"}
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Condiciones : Nivel {selectedCondition.nivel}</Label>
                  {selectedCondition?.nivel > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                selectParentCondition(
                                  selectedNode.condition,
                                  selectedCondition,
                                  setSelectedCondition
                                );
                              }}
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </Button>
                          )}
                  <Button onClick={() => {
                    addCondition(selectedNode.id,selectedCondition.id,selectedCondition.nivel);

                  }} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Condición
                  </Button>
                </div>

                {selectedCondition?.conditions?.length === 0 ? (
                       <div>
                          <p className="text-gray-500 text-center py-8">
                            No hay condiciones configuradas. Agrega una condición para definir el comportamiento de esta
                            billetera.
                          </p>
                          
                        </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCondition?.conditions.map((condition, index) => (
                      <Card key={condition.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">Condición {index + 1} </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                selectChildrenCondition(condition);

                              }}
                            >
                              <ReceiptText className="w-4 h-4" />
                              Detalles Condición
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                removeCondition(selectedNode.id, condition.id);
                                // Update selectedNode after removing condition
                                const updatedNode = nodes.find(n => n.id === selectedNode.id);
                                setSelectedNode(updatedNode || null);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Tipo</Label>
                              <Select
                                value={condition.type}
                                onValueChange={(value: "date" | "amount" | "expiration") =>
                                  updateCondition(selectedNode.id, condition.id, { type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {conditionTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Operador</Label>
                              <Select
                                value={condition.operator}
                                onValueChange={(value: any) =>
                                  updateCondition(selectedNode.id, condition.id, { operator: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {operators[condition.type]?.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                      {op.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Valor</Label>
                              <Input
                                type={
                                  condition.type === "date" ? "date" : condition.type === "amount" ? "number" : "text"
                                }
                                value={condition.value}
                                onChange={(e) =>
                                  updateCondition(selectedNode.id, condition.id, { value: e.target.value })
                                }
                              />
                            </div>

                            {condition.operator === "between" && (
                              <div>
                                <Label>Valor 2</Label>
                                <Input
                                  type={
                                    condition.type === "date" ? "date" : condition.type === "amount" ? "number" : "text"
                                  }
                                  value={condition.value2 || ""}
                                  onChange={(e) =>
                                    updateCondition(selectedNode.id, condition.id, { value2: e.target.value })
                                  }
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <Label>Etiqueta</Label>
                            <Input
                              value={condition.label}
                              onChange={(e) =>
                                updateCondition(selectedNode.id, condition.id, { label: e.target.value })
                              }
                              placeholder="Descripción de la condición"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                 // Abrir diálogo para seleccionar condiciones de salida
                setSelectedExit(selectedCondition.exitConditions);
                setIsSelectingExit(true);
                }}
              >
                  <CornerDownRight className="w-4 h-4" />
                  Flujo Salida
              </Button>

            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={simulateActive} onOpenChange={setSimulate}>
        {/*simulacion de costos */}
      <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Simulacion de Contrato</DialogTitle>
          </DialogHeader>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Costos de Gas</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Despliegue de Contrato</p>
                <p className="text-sm text-gray-600">~$0.50 USD</p>
              </div>
              <span className="text-blue-600 font-semibold">$2,100 COP</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Ejecución</p>
                <p className="text-sm text-gray-600">~$0.01 USD</p>
              </div>
              <span className="text-green-600 font-semibold">$42 COP</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              * Precios en Optimism Testnet. Los costos se incluyen automáticamente en el contrato.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>


     <Dialog open={simulateActive} onOpenChange={setSimulate}>
        {/*simulacion de costos */}
      <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Simulacion de Contrato</DialogTitle>
          </DialogHeader>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Costos de Gas</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Despliegue de Contrato</p>
                <p className="text-sm text-gray-600">~$0.50 USD</p>
              </div>
              <span className="text-blue-600 font-semibold">$2,100 COP</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Ejecución</p>
                <p className="text-sm text-gray-600">~$0.01 USD</p>
              </div>
              <span className="text-green-600 font-semibold">$42 COP</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              * Precios en Optimism Testnet. Los costos se incluyen automáticamente en el contrato.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
{/* Simulación de costos */}

{/*condiciones de salida */}
<Dialog open={isSelectingExit} onOpenChange={setIsSelectingExit}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Condiciones de Salida</DialogTitle>
    </DialogHeader>

    <div className="flex justify-between items-center mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedExit([
            ...selectedExit,
            {
              id: crypto.randomUUID(),
              value: 0,
              order: selectedExit.length + 1,
              walletId: "",
            },
          ]);
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar Condición de Salida
      </Button>
      <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedNode && selectedCondition) {
                updateExitConditions(selectedNode.id, selectedCondition.id, selectedExit);
              }
              setIsSelectingExit(false);
            }}
          >
            <Check className="w-4 h-4 mr-2" />
            Guardar Condiciones
        </Button>
    </div>

    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {selectedExit.map((exitCondition, index) => (
        <div
          key={exitCondition.id}
          className="space-y-4 mb-4 border-b border-gray-200 pb-4"
        >
          <div className="flex items-center justify-between">
            <Label className="font-medium">
              Condición de Salida {index + 1}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSelectedExit(
                  selectedExit.filter((ec) => ec.id !== exitCondition.id)
                )
              }
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                value={exitCondition.value}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setSelectedExit(
                    selectedExit.map((ec) =>
                      ec.id === exitCondition.id
                        ? { ...ec, value: newValue }
                        : ec
                    )
                  );
                }}
              />
            </div>
            <div>
              <Label>Orden</Label>
              <Input
                type="number"
                value={exitCondition.order}
                onChange={(e) => {
                  const newOrder = parseInt(e.target.value);
                  setSelectedExit(
                    selectedExit.map((ec) =>
                      ec.id === exitCondition.id
                        ? { ...ec, order: newOrder }
                        : ec
                    )
                  );
                }}
              />
            </div>
          </div>

          <div>
            <Label>ID de Billetera</Label>
            <Input
              value={exitCondition.walletId}
              onChange={(e) =>
                setSelectedExit(
                  selectedExit.map((ec) =>
                    ec.id === exitCondition.id
                      ? { ...ec, walletId: e.target.value }
                      : ec
                  )
                )
              }
            />
          </div>
        </div>
      ))}
    </div>
  </DialogContent>
</Dialog>


    </div>
  )
}
