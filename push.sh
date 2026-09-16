#!/bin/sh

echo "正在删除远程服务器上的旧文件..."
ssh ecs-user@dustwind.xyz 'sudo rm -rf /var/www/html/select'

echo "正在新建select文件夹..."
ssh ecs-user@dustwind.xyz 'sudo mkdir /var/www/html/select'

echo "将select文件夹所有者修改为ecs-user..."
ssh ecs-user@dustwind.xyz 'sudo chown -R ecs-user /var/www/html/select'

echo "正在将静态页面上传至服务器..."
scp -r ./dist/* ecs-user@dustwind.xyz:/var/www/html/select/

echo "正在设置网页文件所有者为www-data..."
ssh ecs-user@dustwind.xyz 'sudo chown -R www-data /var/www/html/select'
