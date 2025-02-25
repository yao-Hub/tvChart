import { TableTabKey } from "#/order";
import i18n from "@/language/index";
import type { Column } from "element-plus";

const t = i18n.global.t;
interface IColumn {
  dataKey: string;
  key: string;
}

export const tableColumns: Record<TableTabKey, Array<IColumn & Column>> = {
  marketOrder: [
    {
      title: t("table.id"),
      dataKey: "id",
      key: "id",
      width: 100,
      align: "left",
    },
    {
      title: t("table.symbol"),
      dataKey: "symbol",
      key: "symbol",
      width: 120,
      align: "right",
    },
    {
      title: t("table.direction"),
      dataKey: "type",
      key: "type",
      width: 70,
      align: "right",
    },
    {
      title: t("table.openingTime"),
      dataKey: "time_setup",
      key: "time_setup",
      width: 200,
      align: "right",
      minWidth: 190,
    },
    {
      title: t("table.volume"),
      dataKey: "volume",
      key: "volume",
      width: 90,
      align: "right",
    },
    {
      title: t("table.tp"),
      dataKey: "tp_price",
      key: "tp_price",
      width: 90,
      align: "right",
    },
    {
      title: t("table.sl"),
      dataKey: "sl_price",
      key: "sl_price",
      width: 90,
      align: "right",
    },
    {
      title: t("table.admission"),
      dataKey: "open_price",
      key: "open_price",
      width: 90,
      align: "right",
    },
    {
      title: t("table.currentPrice"),
      dataKey: "now_price",
      key: "now_price",
      width: 90,
      align: "right",
    },
    {
      title: t("table.storage"),
      dataKey: "storage",
      key: "storage",
      width: 80,
      align: "right",
    },
    {
      title: t("table.fee"),
      dataKey: "fee",
      key: "fee",
      width: 80,
      align: "right",
    },
    {
      title: t("table.holdingDays"),
      dataKey: "days",
      key: "days",
      width: 90,
      align: "right",
    },
    {
      title: t("table.comment"),
      dataKey: "comment",
      key: "comment",
      width: 300,
      align: "right",
    },
    {
      title: t("table.profit"),
      dataKey: "profit",
      key: "profit",
      width: 110,
      align: "right",
    },
    {
      dataKey: "positionAction",
      key: "action",
      width: 40,
      align: "left",
      minWidth: 40,
    },
  ],
  pendingOrder: [
    {
      title: t("table.id"),
      dataKey: "id",
      key: "id",
      width: 100,
      align: "left",
    },
    {
      title: t("table.symbol"),
      dataKey: "symbol",
      key: "symbol",
      width: 120,
      align: "right",
    },
    {
      title: t("table.orderType"),
      dataKey: "orderType",
      key: "orderType",
      width: 110,
      align: "right",
    },
    {
      title: t("table.pendingAddTime"),
      dataKey: "time_setup",
      key: "time_setup",
      width: 200,
      minWidth: 190,
      align: "right",
    },
    {
      title: t("table.volume"),
      dataKey: "volume",
      key: "volume",
      width: 110,
      align: "right",
    },
    {
      title: t("table.orderPrice"),
      dataKey: "order_price",
      key: "order_price",
      width: 110,
      align: "right",
    },
    {
      title: t("table.currentPrice"),
      dataKey: "now_price",
      key: "now_price",
      width: 100,
      align: "right",
    },
    {
      title: t("table.tp"),
      dataKey: "tp_price",
      key: "tp_price",
      width: 100,
      align: "right",
    },
    {
      title: t("table.sl"),
      dataKey: "sl_price",
      key: "sl_price",
      width: 100,
      align: "right",
    },
    {
      title: t("table.expirationDate"),
      dataKey: "time_expiration",
      key: "time_expiration",
      width: 200,
      minWidth: 190,
      align: "right",
    },
    {
      dataKey: "orderAction",
      key: "action",
      width: 40,
      align: "left",
      minWidth: 40,
    },
  ],
  // 挂单历史
  pendingOrderHistory: [
    {
      title: t("table.id"),
      dataKey: "id",
      key: "id",
      width: 100,
      align: "left",
    },
    {
      title: t("table.symbol"),
      dataKey: "symbol",
      key: "symbol",
      width: 120,
      align: "right",
    },
    {
      title: t("table.orderType"),
      dataKey: "orderType",
      key: "orderType",
      width: 110,
      align: "right",
    },
    {
      title: t("table.orderActivationTime"),
      dataKey: "time_setup",
      key: "time_setup",
      width: 200,
      minWidth: 190,
      align: "right",
    },
    {
      title: t("table.volume"),
      dataKey: "volume",
      key: "volume",
      width: 100,
      align: "right",
    },
    {
      title: t("table.orderPrice"),
      dataKey: "order_price",
      key: "order_price",
      width: 110,
      align: "right",
    },
    {
      title: t("table.tp"),
      dataKey: "tp_price",
      key: "tp_price",
      width: 100,
      align: "right",
    },
    {
      title: t("table.sl"),
      dataKey: "sl_price",
      key: "sl_price",
      width: 100,
      align: "right",
    },
    {
      title: t("table.expirationDate"),
      dataKey: "time_expiration",
      key: "time_expiration",
      width: 200,
      minWidth: 190,
      align: "right",
    },
    {
      title: t("table.closingTime"),
      dataKey: "time_done",
      key: "time_done",
      width: 200,
      minWidth: 190,
      align: "right",
    },
    // 占位，用于最尾的列拉伸
    {
      title: "",
      dataKey: "Placeholder",
      key: "Placeholder",
      width: 1,
      minWidth: 1,
    },
  ],
  // 持仓历史
  marketOrderHistory: [
    {
      title: t("table.id"),
      dataKey: "id",
      key: "id",
      width: 100,
      align: "left",
    },
    {
      title: t("table.symbol"),
      dataKey: "symbol",
      key: "symbol",
      width: 120,
      align: "right",
    },
    {
      title: t("table.direction"),
      dataKey: "type",
      key: "type",
      width: 70,
      align: "right",
    },
    {
      title: t("table.openingTime"),
      dataKey: "time_setup",
      key: "open_time",
      width: 200,
      minWidth: 190,
      align: "right",
    },
    {
      title: t("table.positionClosingTime"),
      dataKey: "close_time",
      key: "close_time",
      width: 200,
      minWidth: 190,
      align: "right",
    },
    {
      title: t("table.admission"),
      dataKey: "open_price",
      key: "open_price",
      width: 110,
      align: "right",
    },
    {
      title: t("table.volume"),
      dataKey: "volume",
      key: "volume",
      width: 80,
      align: "right",
    },
    {
      title: t("table.tp"),
      dataKey: "tp_price",
      key: "tp_price",
      width: 100,
      align: "right",
    },
    {
      title: t("table.sl"),
      dataKey: "sl_price",
      key: "sl_price",
      width: 100,
      align: "right",
    },
    // {
    //   title: t("table.closeOrderId"),
    //   dataKey: "from_id",
    //   key: "from_id",
    //   width: 130,
    //   align: "right",
    // },
    {
      title: t("table.exitPrice"),
      dataKey: "close_price",
      key: "close_price",
      width: 110,
      align: "right",
    },
    {
      title: t("table.closeType"),
      dataKey: "close_type",
      key: "close_type",
      width: 160,
      minWidth: 160,
      align: "right",
    },
    {
      title: t("table.profit"),
      dataKey: "profit",
      key: "profit",
      width: 110,
      align: "right",
    },
    {
      title: t("table.comment"),
      dataKey: "comment",
      key: "comment",
      width: 100,
      align: "right",
    },
    {
      title: t("table.storage"),
      dataKey: "storage",
      key: "storage",
      width: 100,
      align: "right",
    },
    {
      title: t("table.fee"),
      dataKey: "fee",
      key: "fee",
      width: 100,
      align: "right",
    },
    {
      title: t("table.holdingDays"),
      dataKey: "days",
      key: "days",
      width: 100,
      align: "right",
    },
    // 占位，用于最尾的列拉伸
    {
      title: "",
      dataKey: "Placeholder",
      key: "Placeholder",
      width: 1,
      minWidth: 1,
    },
  ],
  blanceRecord: [
    {
      title: t("table.id"),
      dataKey: "id",
      key: "id",
      width: 100,
      align: "left",
    },
    {
      title: t("table.time"),
      dataKey: "time_setup",
      key: "open_time",
      width: 200,
      minWidth: 190,
      align: "right",
    },
    {
      title: t("table.blance"),
      dataKey: "profit",
      key: "blance",
      width: 110,
      align: "right",
    },
    {
      title: t("table.blanceType"),
      dataKey: "blanceType",
      key: "blanceType",
      width: 110,
      align: "right",
    },
    {
      title: t("table.comment"),
      dataKey: "comment",
      key: "comment",
      width: 300,
      align: "right",
    },
    // 占位，用于最尾的列拉伸
    {
      title: "",
      dataKey: "Placeholder",
      key: "Placeholder",
      width: 1,
      minWidth: 1,
    },
  ],
  log: [
    {
      title: t("table.time"),
      dataKey: "time",
      key: "time",
      width: 200,
      minWidth: 190,
      align: "left",
    },
    {
      title: t("table.source"),
      dataKey: "source",
      key: "source",
      width: 120,
      align: "right",
    },
    {
      title: t("table.content"),
      dataKey: "content",
      key: "content",
      width: 500,
      align: "right",
    },
    // 占位，用于最尾的列拉伸
    {
      title: "",
      dataKey: "Placeholder",
      key: "Placeholder",
      width: 1,
      minWidth: 1,
    },
  ],
};
