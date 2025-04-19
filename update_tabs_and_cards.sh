#!/bin/bash
# Update TabsList background and border
sed -i 's/\[#F5F5F7\]/\[#eeeeee\]/g' client/src/pages/dashboard-page.tsx
sed -i 's/\[#E8E8ED\]/\[#979797\]/g' client/src/pages/dashboard-page.tsx
# Update rounded-lg to rounded-md
sed -i 's/rounded-lg/rounded-md/g' client/src/pages/dashboard-page.tsx
