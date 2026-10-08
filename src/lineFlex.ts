import type { InventoryItem } from './types';

// Standard Quick Reply items for all LINE bot responses
export function getStandardQuickReplies() {
  return {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '📦 สรุปสต็อก',
          text: 'สต็อก',
        },
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '⚠️ สินค้าใกล้หมด',
          text: 'ใกล้หมด',
        },
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '📜 ดูประวัติ',
          text: 'ประวัติ',
        },
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '❓ คู่มือคำสั่ง',
          text: 'คำสั่ง',
        },
      },
    ],
  };
}

// Generate LINE Flex Message for item detail
export function buildItemDetailFlex(item: InventoryItem) {
  const isOut = item.quantity === 0;
  const isLow = !isOut && item.quantity <= item.minThreshold;
  const statusColor = isOut ? '#EF4444' : isLow ? '#F59E0B' : '#10B981';
  const statusText = isOut ? 'สินค้าหมดสต๊อก ❌' : isLow ? 'สินค้าใกล้หมด ⚠️' : 'สต็อกพร้อมจำหน่าย ✅';

  return {
    type: 'flex',
    altText: `[ข้อมูลสต็อก] ${item.name}: ${item.quantity} ${item.unit}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0F172A',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: item.sku,
                size: 'xs',
                color: '#10B981',
                weight: 'bold',
                flex: 1,
              },
              {
                type: 'text',
                text: item.category,
                size: 'xxs',
                color: '#94A3B8',
                align: 'end',
              },
            ],
          },
          {
            type: 'text',
            text: item.name,
            weight: 'bold',
            size: 'md',
            color: '#FFFFFF',
            margin: 'sm',
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1E293B',
        paddingAll: '16px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'ยอดคงเหลือ',
                    size: 'xs',
                    color: '#94A3B8',
                  },
                  {
                    type: 'text',
                    text: `${item.quantity.toLocaleString()} ${item.unit}`,
                    size: 'xl',
                    weight: 'bold',
                    color: statusColor,
                    margin: 'xs',
                  },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'จุดเตือนขั้นต่ำ',
                    size: 'xs',
                    color: '#94A3B8',
                    align: 'end',
                  },
                  {
                    type: 'text',
                    text: `${item.minThreshold} ${item.unit}`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#F59E0B',
                    align: 'end',
                    margin: 'xs',
                  },
                ],
              },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            contents: [
              {
                type: 'text',
                text: statusText,
                size: 'xs',
                color: statusColor,
                weight: 'bold',
              },
            ],
          },
          {
            type: 'separator',
            margin: 'md',
            color: '#334155',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ราคาขาย', size: 'xs', color: '#94A3B8' },
                  { type: 'text', text: `฿${item.price}`, size: 'xs', color: '#FFFFFF', align: 'end' },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'ตำแหน่งที่เก็บ', size: 'xs', color: '#94A3B8' },
                  { type: 'text', text: item.location || 'คลังหลัก', size: 'xs', color: '#FFFFFF', align: 'end' },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: '#0F172A',
        spacing: 'sm',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#10B981',
            height: 'sm',
            action: {
              type: 'message',
              label: '+ เพิ่ม 10',
              text: `+ ${item.sku} 10`,
            },
          },
          {
            type: 'button',
            style: 'primary',
            color: '#EF4444',
            height: 'sm',
            action: {
              type: 'message',
              label: '- ตัดขาย 1',
              text: `- ${item.sku} 1`,
            },
          },
        ],
      },
    },
    quickReply: getStandardQuickReplies(),
  };
}

// Generate LINE Flex Message for Low Stock Alert
export function buildLowStockAlertFlex(lowItems: InventoryItem[]) {
  if (lowItems.length === 0) {
    return {
      type: 'text',
      text: '🎉 สินค้าทุกรายการอยู่ในระดับปลอดภัย ไม่มีรายการใกล้หมดสต็อกในขณะนี้!',
      quickReply: getStandardQuickReplies(),
    };
  }

  const itemsList = lowItems.slice(0, 8).map(i => {
    const isOut = i.quantity === 0;
    return {
      type: 'box',
      layout: 'horizontal',
      margin: 'md',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          flex: 4,
          contents: [
            {
              type: 'text',
              text: `[${i.sku}] ${i.name}`,
              size: 'xs',
              weight: 'bold',
              color: '#FFFFFF',
              wrap: true,
            },
            {
              type: 'text',
              text: `ที่เก็บ: ${i.location || 'คลังหลัก'}`,
              size: 'xxs',
              color: '#94A3B8',
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          flex: 2,
          contents: [
            {
              type: 'text',
              text: isOut ? 'หมด (0)' : `${i.quantity} ${i.unit}`,
              size: 'xs',
              weight: 'bold',
              color: isOut ? '#EF4444' : '#F59E0B',
              align: 'end',
            },
            {
              type: 'text',
              text: `เตือน: ${i.minThreshold}`,
              size: 'xxs',
              color: '#64748B',
              align: 'end',
            },
          ],
        },
      ],
    };
  });

  return {
    type: 'flex',
    altText: `⚠️ แจ้งเตือน: มีสินค้าใกล้หมดสต็อก ${lowItems.length} รายการ`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#7F1D1D',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '⚠️ แจ้งเตือนสินค้าใกล้หมดสต็อก',
            weight: 'bold',
            size: 'md',
            color: '#FEE2E2',
          },
          {
            type: 'text',
            text: `พบ ${lowItems.length} รายการที่ต้องสั่งซื้อเพิ่มเร่งด่วน`,
            size: 'xs',
            color: '#FCA5A5',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1E293B',
        paddingAll: '16px',
        contents: itemsList,
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0F172A',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#10B981',
            height: 'sm',
            action: {
              type: 'message',
              label: '📦 ดูสต็อกทั้งหมด',
              text: 'สต็อก',
            },
          },
        ],
      },
    },
    quickReply: getStandardQuickReplies(),
  };
}

// Generate LINE Flex Message for Stock Summary
export function buildStockSummaryFlex(items: InventoryItem[]) {
  const lowCount = items.filter(i => i.quantity <= i.minThreshold).length;
  const outCount = items.filter(i => i.quantity === 0).length;

  const topItems = items.slice(0, 7).map(i => {
    const isOut = i.quantity === 0;
    const isLow = !isOut && i.quantity <= i.minThreshold;
    const color = isOut ? '#EF4444' : isLow ? '#F59E0B' : '#10B981';

    return {
      type: 'box',
      layout: 'horizontal',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: `[${i.sku}] ${i.name}`,
          size: 'xs',
          color: '#E2E8F0',
          flex: 4,
          maxLines: 1,
        },
        {
          type: 'text',
          text: `${i.quantity} ${i.unit}`,
          size: 'xs',
          weight: 'bold',
          color,
          flex: 2,
          align: 'end',
        },
      ],
    };
  });

  return {
    type: 'flex',
    altText: `📦 รายการสต็อกสินค้าคงเหลือ (${items.length} รายการ)`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0F172A',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '📦 สรุปยอดสต็อกคงเหลือ',
            weight: 'bold',
            size: 'md',
            color: '#10B981',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'sm',
            contents: [
              {
                type: 'text',
                text: `รวม ${items.length} รายการ`,
                size: 'xs',
                color: '#94A3B8',
              },
              {
                type: 'text',
                text: `ใกล้หมด: ${lowCount} | หมด: ${outCount}`,
                size: 'xs',
                color: lowCount > 0 ? '#F59E0B' : '#10B981',
                align: 'end',
              },
            ],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1E293B',
        paddingAll: '16px',
        contents: topItems,
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: '#0F172A',
        spacing: 'sm',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'message',
              label: '⚠️ สินค้าใกล้หมด',
              text: 'ใกล้หมด',
            },
          },
          {
            type: 'button',
            style: 'primary',
            color: '#10B981',
            height: 'sm',
            action: {
              type: 'message',
              label: '❓ คู่มือคำสั่ง',
              text: 'คำสั่ง',
            },
          },
        ],
      },
    },
    quickReply: getStandardQuickReplies(),
  };
}

// Generate LINE Flex Message for Help / Commands
export function buildHelpFlex() {
  return {
    type: 'flex',
    altText: '📋 คู่มือคำสั่งจัดการสต๊อกผ่าน LINE OA',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#065F46',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '📋 คำสั่งจัดการสต๊อก LINE OA',
            weight: 'bold',
            size: 'md',
            color: '#ECFDF5',
          },
          {
            type: 'text',
            text: 'พนักงานสามารถพิมพ์สั่งการได้ทันที',
            size: 'xs',
            color: '#A7F3D0',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1E293B',
        paddingAll: '16px',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '📥 รับเข้าสินค้า (เพิ่มสต็อก)', size: 'xs', weight: 'bold', color: '#10B981' },
              { type: 'text', text: 'พิมพ์: + [รหัส] [จำนวน]', size: 'xs', color: '#FFFFFF', margin: 'xs' },
              { type: 'text', text: 'ตัวอย่าง: + COKE-325 24 หรือ เพิ่ม โค้ก 20', size: 'xxs', color: '#94A3B8' },
            ],
          },
          {
            type: 'separator',
            color: '#334155',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '📤 ตัดจำหน่าย / ขาย (ลดสต็อก)', size: 'xs', weight: 'bold', color: '#EF4444' },
              { type: 'text', text: 'พิมพ์: - [รหัส] [จำนวน]', size: 'xs', color: '#FFFFFF', margin: 'xs' },
              { type: 'text', text: 'ตัวอย่าง: - MAMA-TOM 2 หรือ ขาย เลย์ 5', size: 'xxs', color: '#94A3B8' },
            ],
          },
          {
            type: 'separator',
            color: '#334155',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '🔍 เช็คสต็อกเฉพาะรายการ', size: 'xs', weight: 'bold', color: '#38BDF8' },
              { type: 'text', text: 'พิมพ์: เช็ค [รหัสหรือชื่อสินค้า]', size: 'xs', color: '#FFFFFF', margin: 'xs' },
              { type: 'text', text: 'ตัวอย่าง: เช็ค COKE-325', size: 'xxs', color: '#94A3B8' },
            ],
          },
          {
            type: 'separator',
            color: '#334155',
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '🎯 ตั้งยอดตรง (ตรวจนับสต๊อก)', size: 'xs', weight: 'bold', color: '#F59E0B' },
              { type: 'text', text: 'พิมพ์: ตั้ง [รหัส] [จำนวน] หรือ = [รหัส] [จำนวน]', size: 'xs', color: '#FFFFFF', margin: 'xs' },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: '#0F172A',
        spacing: 'sm',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#10B981',
            height: 'sm',
            action: {
              type: 'message',
              label: '📦 ดูสต็อก',
              text: 'สต็อก',
            },
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'message',
              label: '⚠️ สินค้าใกล้หมด',
              text: 'ใกล้หมด',
            },
          },
        ],
      },
    },
    quickReply: getStandardQuickReplies(),
  };
}
