import re, json

# ========== 1. 从5e5.txt提取冒险用品 ==========
with open('5e5.txt', 'r', encoding='utf-8') as f:
    content5 = f.read()

# 提取冒险用品表
gear_items = []
# 找到所有'物品 价格 重量'的位置
positions = [m.start() for m in re.finditer('物品 价格 重量', content5)]
print(f'找到 {len(positions)} 个物品表位置')

for idx, pos in enumerate(positions):
    end_pos = len(content5)
    if idx + 1 < len(positions):
        end_pos = positions[idx + 1]
    else:
        for marker in ['装备套组', 'Page 11 of']:
            m_pos = content5.find(marker, pos + 50)
            if m_pos > 0 and m_pos < end_pos:
                end_pos = m_pos
                break
    
    gear_text = content5[pos:end_pos]
    lines = gear_text.split('\n')
    current_category = '通用物品'
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('物品') or line.startswith('Page'):
            continue
        if '法器' in line and ('arcane' in line or 'druidic' in line or 'holy symbol' in line):
            current_category = '法器'
            continue
        if '弹药' in line and 'ammunition' in line:
            current_category = '弹药'
            continue
        
        m = re.match(r'([\u4e00-\u9fff][\u4e00-\u9fff\w\s,，（）()\-]*?)([a-zA-Z][\w\s\'’,.]*?)\s+(\d+\s*(?:gp|sp|cp|－|—))\s+([\d/]+\s*磅|－|—)', line)
        if m:
            cn_name = m.group(1).strip()
            en_name = m.group(2).strip()
            cost = m.group(3).strip()
            weight = m.group(4).strip()
            gear_items.append({
                'cn': cn_name,
                'en': en_name,
                'cost': cost,
                'weight': weight,
                'category': current_category
            })

print(f'提取到 {len(gear_items)} 个冒险用品')
for item in gear_items:
    print(f"  {item['cn']} ({item['en']}) - {item['cost']} - {item['weight']} [{item['category']}]")

# 保存到文件
with open('data/adventuringGear.json', 'w', encoding='utf-8') as f:
    json.dump(gear_items, f, ensure_ascii=False, indent=2)
print(f'\n已保存到 data/adventuringGear.json')