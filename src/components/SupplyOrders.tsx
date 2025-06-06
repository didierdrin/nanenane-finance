import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { firestore as db } from "../../firebaseApp";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Tabs, Tab } from "@mui/material";

interface FisherOrder {
  id: string;
  agentUuid: string;
  amountToBePaid: number;
  fishStockWeight: number;
  fishType: string;
  location: string;
  status: string;
  timestamp: Timestamp;
  userUuid: string;
}

const CurrentOrders = () => {
  const [orders, setOrders] = useState<FisherOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<FisherOrder | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    let q;
    switch(currentTab) {
      case 0: // Pending/Processing
        q = query(
          collection(db, "inventoryFisherNane"),
          where("status", "==", "pending")
        );
        break;
      case 1: // Approved/Completed
        q = query(
          collection(db, "inventoryFisherNane"),
          where("status", "==", "approved")
        );
        break;
      case 2: // Rejected
        q = query(
          collection(db, "inventoryFisherNane"),
          where("status", "==", "rejected")
        );
        break;
      default:
        q = query(collection(db, "inventoryFisherNane"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: FisherOrder[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<FisherOrder, "id">),
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [currentTab]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "inventoryFisherNane", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleTabChange = (_: any, newValue: number) => {
    setCurrentTab(newValue);
  };

  const formatDate = (timestamp: Timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp.toDate());
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="bg-white">
      <Tabs value={currentTab} onChange={handleTabChange} className="border-b border-slate-400">
        <Tab label="Pending" />
        <Tab label="Approved" />
        <Tab label="Rejected" />
      </Tabs>

      <div className="p-4">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No fish orders found
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md mb-4 p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold">Fish Order #{order.id.slice(-8)}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {formatDate(order.timestamp)}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {capitalizeFirst(order.status)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Amount to be Paid</p>
                  <p className="font-bold">Shs {order.amountToBePaid}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-b py-3 mb-4">
                <div className="flex justify-between">
                  <span className="font-medium">Fish Type</span>
                  <span className="capitalize">{order.fishType}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Stock Weight</span>
                  <span>{order.fishStockWeight} kg</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Location</span>
                  <span className="capitalize">{order.location}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">User ID</span>
                  <span className="text-sm text-gray-600">{order.userUuid}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Agent ID</span>
                  <span className="text-sm text-gray-600">{order.agentUuid}</span>
                </div>
              </div>

              <div className="flex justify-between space-x-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
                
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'approved')}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {order.status === 'approved' && (
                  <>
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                    className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors"
                  >
                    Mark Pending
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded hover:bg-emerald-700 transition-colors"
                  >
                    Pay
                  </button>
                  </>
                )}
                
                {order.status === 'rejected' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'pending')}
                    className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition-colors"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog 
        open={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Fish Order Details #{selectedOrder?.id.slice(-8)}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-gray-700">Order Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                        {capitalizeFirst(selectedOrder.status)}
                      </span>
                    </p>
                    <p><span className="font-medium">Fish Type:</span> 
                      <span className="ml-2 capitalize">{selectedOrder.fishType}</span>
                    </p>
                    <p><span className="font-medium">Weight:</span> 
                      <span className="ml-2">{selectedOrder.fishStockWeight} kg</span>
                    </p>
                    <p><span className="font-medium">Location:</span> 
                      <span className="ml-2 capitalize">{selectedOrder.location}</span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-gray-700">Payment Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Amount to be Paid:</span> 
                      <span className="ml-2 font-bold text-green-600">Shs {selectedOrder.amountToBePaid}</span>
                    </p>
                    <p><span className="font-medium">Price per kg:</span> 
                      <span className="ml-2">Shs {(selectedOrder.amountToBePaid / selectedOrder.fishStockWeight).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-gray-700">User & Agent Information</h4>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <p><span className="font-medium">User UUID:</span> 
                    <span className="ml-2 text-sm font-mono">{selectedOrder.userUuid}</span>
                  </p>
                  <p><span className="font-medium">Agent UUID:</span> 
                    <span className="ml-2 text-sm font-mono">{selectedOrder.agentUuid}</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-gray-700">Timestamp</h4>
                <p className="text-sm bg-blue-50 p-2 rounded">
                  {formatDate(selectedOrder.timestamp)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Close</Button>
          {selectedOrder && selectedOrder.status === 'pending' && (
            <>
              <Button 
                onClick={() => {
                  handleUpdateOrderStatus(selectedOrder.id, 'approved');
                  setSelectedOrder(null);
                }}
                className="text-green-600"
              >
                Approve
              </Button>
              <Button 
                onClick={() => {
                  handleUpdateOrderStatus(selectedOrder.id, 'rejected');
                  setSelectedOrder(null);
                }}
                className="text-red-600"
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CurrentOrders;