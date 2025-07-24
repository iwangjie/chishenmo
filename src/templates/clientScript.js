export function getClientScript() {
  return `
    <script>
        let currentWheelId = null;
        let userId = localStorage.getItem('userId') || generateId();
        let wheelData = null;
        let isSpinning = false;
        let pollInterval = null;
        let refreshCheckInterval = null;
        let lastRefreshTrigger = localStorage.getItem('lastRefreshTrigger') || '0';
        let privilegeMode = false;
        
        localStorage.setItem('userId', userId);
        
        function generateId() {
            return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
        
        // 页面加载时自动连接最新转盘
        window.addEventListener('DOMContentLoaded', async () => {
            await connectToLatestWheel();
            startRefreshCheck();
        });
        
        async function connectToLatestWheel() {
            try {
                document.getElementById('connectionStatus').innerHTML = '<p>🔄 正在连接最新转盘...</p>';
                
                const response = await fetch('/api/latest');
                if (response.ok) {
                    const data = await response.json();
                    currentWheelId = data.id;
                    wheelData = data;
                    
                    document.getElementById('connectionStatus').innerHTML = '<p>✅ 已连接到最新转盘</p>';
                    showGameArea();
                    startPolling();
                } else {
                    document.getElementById('connectionStatus').innerHTML = '<p>❌ 暂无可用转盘，请初始化新转盘</p>';
                }
            } catch (error) {
                document.getElementById('connectionStatus').innerHTML = '<p>❌ 连接失败，请检查网络</p>';
                console.error('连接失败:', error);
            }
        }
        
        async function initWheel() {
            try {
                document.getElementById('connectionStatus').innerHTML = '<p>🔄 正在初始化新转盘...</p>';
                
                const response = await fetch('/api/init', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    // 清除当前用户的食物记录
                    if (currentWheelId) {
                        localStorage.removeItem(\`userFood_\${currentWheelId}\`);
                    }
                    
                    // 重新连接到最新转盘
                    await connectToLatestWheel();
                } else {
                    alert('初始化失败');
                }
            } catch (error) {
                alert('初始化失败: ' + error.message);
            }
        }
        
        // 检查是否需要刷新连接
        async function checkForRefresh() {
            try {
                const response = await fetch('/api/refresh-check');
                if (response.ok) {
                    const data = await response.json();
                    if (data.refreshTrigger !== lastRefreshTrigger) {
                        lastRefreshTrigger = data.refreshTrigger;
                        localStorage.setItem('lastRefreshTrigger', lastRefreshTrigger);
                        
                        // 如果当前用户不是触发刷新的用户，则重新连接
                        await connectToLatestWheel();
                    }
                }
            } catch (error) {
                console.error('刷新检查失败:', error);
            }
        }
        
        function startRefreshCheck() {
            if (refreshCheckInterval) clearInterval(refreshCheckInterval);
            refreshCheckInterval = setInterval(checkForRefresh, 3000);
        }
        
        function showGameArea() {
            document.getElementById('gameArea').style.display = 'block';
            
            if (privilegeMode) {
                showPrivilegeMode();
            } else {
                const userFood = localStorage.getItem(\`userFood_\${currentWheelId}\`);
                if (userFood) {
                    showUserFood(userFood);
                } else {
                    showFoodInput();
                }
            }
        }
        
        function showFoodInput() {
            document.getElementById('foodInput').style.display = 'block';
            document.getElementById('userFood').style.display = 'none';
            document.getElementById('privilegeFoods').style.display = 'none';
        }
        
        function showUserFood(food) {
            document.getElementById('foodInput').style.display = 'none';
            document.getElementById('userFood').style.display = 'block';
            document.getElementById('privilegeFoods').style.display = 'none';
            document.getElementById('currentFood').textContent = food;
        }
        
        function editFood() {
            document.getElementById('foodName').value = document.getElementById('currentFood').textContent;
            showFoodInput();
        }
        
        async function addFood() {
            const food = document.getElementById('foodName').value.trim();
            if (!food) {
                alert('请输入食物名称');
                return;
            }
            
            try {
                const response = await fetch(\`/api/wheel/\${currentWheelId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'addFood',
                        food: food,
                        userId: userId
                    })
                });
                
                if (response.ok) {
                    localStorage.setItem(\`userFood_\${currentWheelId}\`, food);
                    showUserFood(food);
                    document.getElementById('foodName').value = '';
                    updateWheel();
                } else {
                    alert('添加失败');
                }
            } catch (error) {
                alert('添加失败: ' + error.message);
            }
        }
        
        // 特权模式相关功能
        function togglePrivilegeMode() {
            const toggle = document.getElementById('privilegeToggle');
            const input = document.getElementById('privilegeInput');
            
            if (!privilegeMode) {
                // 显示密码输入框
                input.style.display = 'block';
                document.getElementById('privilegePassword').focus();
                
                // 监听密码输入
                const passwordInput = document.getElementById('privilegePassword');
                passwordInput.addEventListener('input', function(e) {
                    if (e.target.value === '627') {
                        // 密码正确，激活特权模式
                        privilegeMode = true;
                        toggle.classList.add('active');
                        input.style.display = 'none';
                        showPrivilegeMode();
                        e.target.value = '';
                    } else if (e.target.value.length >= 3) {
                        // 密码错误
                        e.target.value = '';
                        e.target.placeholder = '密码错误';
                        setTimeout(() => {
                            e.target.placeholder = '密码';
                            input.style.display = 'none';
                        }, 1000);
                    }
                });
            } else {
                // 关闭特权模式
                privilegeMode = false;
                toggle.classList.remove('active');
                hidePrivilegeMode();
            }
        }
        
        function showPrivilegeMode() {
            document.getElementById('privilegeFoods').style.display = 'block';
            document.getElementById('foodInput').style.display = 'none';
            document.getElementById('userFood').style.display = 'none';
        }
        
        function hidePrivilegeMode() {
            document.getElementById('privilegeFoods').style.display = 'none';
            // 恢复正常模式显示
            const userFood = localStorage.getItem(\`userFood_\${currentWheelId}\`);
            if (userFood) {
                showUserFood(userFood);
            } else {
                showFoodInput();
            }
        }
        
        async function addPrivilegeFood() {
            const food = document.getElementById('privilegeFoodName').value.trim();
            if (!food) {
                alert('请输入食物名称');
                return;
            }
            
            try {
                const response = await fetch(\`/api/wheel/\${currentWheelId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'addFood',
                        food: food,
                        userId: 'privilege_' + userId // 特权模式标识
                    })
                });
                
                if (response.ok) {
                    document.getElementById('privilegeFoodName').value = '';
                    updateWheel();
                } else {
                    alert('添加失败');
                }
            } catch (error) {
                alert('添加失败: ' + error.message);
            }
        }
        
        async function clearAllFoods() {
            if (!confirm('确定要清空所有食物吗？此操作不可撤销！')) {
                return;
            }
            
            try {
                // 重新初始化转盘来清空所有食物
                await initWheel();
            } catch (error) {
                alert('清空失败: ' + error.message);
            }
        }
        
        async function spinWheel() {
            if (isSpinning) return;
            
            try {
                await fetch(\`/api/wheel/\${currentWheelId}\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'spin'
                    })
                });
                
                // 开始转动动画
                startSpinAnimation();
                
                // 随机转动时间 3-5秒
                const spinTime = 3000 + Math.random() * 2000;
                
                setTimeout(async () => {
                    const foods = Object.values(wheelData.foods);
                    const result = foods[Math.floor(Math.random() * foods.length)].food;
                    
                    await fetch(\`/api/wheel/\${currentWheelId}\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'result',
                            food: result
                        })
                    });
                    
                    stopSpinAnimation();
                    updateWheel();
                }, spinTime);
                
            } catch (error) {
                alert('转动失败: ' + error.message);
            }
        }
        
        function startSpinAnimation() {
            isSpinning = true;
            document.getElementById('spinBtn').disabled = true;
            document.getElementById('result').innerHTML = '<span class="spinning">转动中...</span>';
            
            const wheel = document.getElementById('wheel');
            let rotation = 0;
            const spinInterval = setInterval(() => {
                rotation += 10 + Math.random() * 20;
                wheel.style.transform = \`rotate(\${rotation}deg)\`;
            }, 50);
            
            window.spinInterval = spinInterval;
        }
        
        function stopSpinAnimation() {
            isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
            clearInterval(window.spinInterval);
        }
        
        async function updateWheel() {
            try {
                const response = await fetch(\`/api/wheel/\${currentWheelId}\`);
                wheelData = await response.json();
                
                renderWheel();
                renderFoodList();
                renderHistory();
                updateResult();
                updateSpinButton();
                
            } catch (error) {
                console.error('更新失败:', error);
            }
        }
        
        // 优化转盘渲染函数
        function renderWheel() {
            const wheel = document.getElementById('wheel');
            const foods = Object.values(wheelData.foods);
            
            if (foods.length === 0) {
                wheel.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 18px;">暂无食物</div>';
                return;
            }
            
            wheel.innerHTML = '';
            
            // 更丰富的颜色数组，支持更多食物
            const colors = [
                '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', 
                '#ff9ff3', '#54a0ff', '#5f27cd', '#ff6348', '#2ed573',
                '#3742fa', '#f368e0', '#ff9f43', '#0abde3', '#ee5a52',
                '#10ac84', '#5f27cd', '#00d2d3', '#ff9ff3', '#54a0ff'
            ];
            
            const segmentAngle = 360 / foods.length;
            
            foods.forEach((item, index) => {
                const segment = document.createElement('div');
                segment.className = 'wheel-segment';
                segment.style.backgroundColor = colors[index % colors.length];
                
                // 计算每个扇形的角度和位置
                const startAngle = segmentAngle * index;
                
                // 使用更精确的扇形绘制
                segment.style.transform = \`rotate(\${startAngle}deg)\`;
                
                // 根据食物数量调整字体大小和布局
                let fontSize = '16px';
                if (foods.length > 8) fontSize = '14px';
                if (foods.length > 12) fontSize = '12px';
                if (foods.length > 16) fontSize = '10px';
                if (foods.length > 20) fontSize = '9px';
                
                // 创建扇形的clip-path
                const angle = segmentAngle * Math.PI / 180;
                const x = Math.cos(angle / 2) * 50;
                const y = Math.sin(angle / 2) * 50;
                
                segment.style.clipPath = \`polygon(100% 100%, 0% 100%, \${x}% \${100-y}%)\`;
                segment.style.fontSize = fontSize;
                
                const textDiv = document.createElement('div');
                textDiv.className = 'wheel-segment-text';
                textDiv.textContent = item.food;
                segment.appendChild(textDiv);
                
                wheel.appendChild(segment);
            });
        }
        
        function renderFoodList() {
            const foodList = document.getElementById('foodList');
            const foods = Object.values(wheelData.foods);
            
            if (foods.length === 0) {
                foodList.innerHTML = '<p>暂无食物</p>';
                return;
            }
            
            foodList.innerHTML = foods.map(item => 
                \`<span class="food-item">\${item.food}</span>\`
            ).join('');
        }
        
        function renderHistory() {
            const historyList = document.getElementById('historyList');
            
            if (!wheelData.history || wheelData.history.length === 0) {
                historyList.innerHTML = '<p>暂无历史记录</p>';
                return;
            }
            
            historyList.innerHTML = wheelData.history
                .slice(-10) // 只显示最近10条
                .reverse()
                .map(item => \`
                    <div class="history-item">
                        <span>\${item.result}</span>
                        <span>\${new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                \`).join('');
        }
        
        function updateResult() {
            const result = document.getElementById('result');
            
            if (wheelData.spinning) {
                result.innerHTML = '<span class="spinning">转动中...</span>';
            } else if (wheelData.result) {
                result.innerHTML = \`🎉 结果: <strong>\${wheelData.result}</strong>\`;
            } else {
                result.innerHTML = '';
            }
        }
        
        function updateSpinButton() {
            const spinBtn = document.getElementById('spinBtn');
            const foods = Object.values(wheelData.foods);
            
            spinBtn.disabled = foods.length === 0 || wheelData.spinning;
        }
        
        function startPolling() {
            if (pollInterval) clearInterval(pollInterval);
            
            updateWheel();
            pollInterval = setInterval(updateWheel, 2000);
        }
        
        // 页面卸载时清理
        window.addEventListener('beforeunload', () => {
            if (pollInterval) clearInterval(pollInterval);
            if (refreshCheckInterval) clearInterval(refreshCheckInterval);
        });
    </script>
</body>
</html>`;
}