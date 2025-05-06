import React, { useState } from "react";
import { Button } from "react-native";
// This component needs UI components to be installed or created
function App() {
  const [showDrawer, setShowDrawer] = useState(false);
 
 
 
 
 return <>




  
  <Button title="Open Drawer" onPress={() => setShowDrawer(true)} />
  
  
    
    
  </>;
}