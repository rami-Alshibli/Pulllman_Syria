import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export type SeatStatus = "available" | "reserved" | "fixed" | "booking";

export type BusTypes =
  | "economyLarge"
  | "economyMedium"
  | "firstClassLarge"
  | "firstClassMedium"
  | "businessLarge"
  | "businessMedium";

interface SeatsMapBaseProps {
  layout?: BusTypes;
  reservedSeats?: number[];
  fixedSeats?: number[];
  bookingSeats?: number[];
  onSeatPress: (seatNumber: number) => void;
}

const ROWS_COUNT = 8;
const SEATS_PER_ROW = 4;
export const TOTAL_SEATS = ROWS_COUNT * SEATS_PER_ROW; // 32 seats

// ============ مكوّن المقعد الواحد (مطابق تماماً لمقاعد الويب) ============
interface SeatProps {
  number: number;
  status?: SeatStatus;
  onPress: (num: number) => void;
}

const Seat = ({ number, status = "available", onPress }: SeatProps) => {
  const isAvailable = status === "available";
  const isSelected = status === "booking";
  const isReserved = status === "reserved";
  const isFixed = status === "fixed";

  let bgClass = "bg-gray-50 border-gray-300";
  let textClass = "text-[#1f2937]";
  let barClass = "bg-gray-400";

  if (isFixed) {
    // مثبت نقداً (كحلي غامق)
    bgClass = "bg-[#1f2937] border-[#1f2937]";
    textClass = "text-white";
    barClass = "bg-white/30";
  } else if (isReserved) {
    // محجوز مؤقتاً عبر التطبيق (برتقالي)
    bgClass = "bg-[#ea580c] border-[#ea580c]";
    textClass = "text-white";
    barClass = "bg-white/40";
  } else if (isSelected) {
    // محدد حالياً بواسطة المستخدم (أصفر ذهبي مميز)
    bgClass = "bg-[#f59e0b] border-2 border-[#d97706]";
    textClass = "text-white";
    barClass = "bg-white/50";
  }

  return (
    <Pressable
      onPress={() => (isAvailable || isSelected) && onPress(number)}
      disabled={!isAvailable && !isSelected}
      className={`w-11 h-11 rounded-xl items-center justify-center border shadow-sm ${bgClass}`}
    >
      <View className={`h-1 w-5 rounded-full mb-0.5 ${barClass}`} />
      <Text className={`text-xs font-bold ${textClass}`}>{number}</Text>
    </Pressable>
  );
};

// ============ خريطة الباص (32 مقعداً مطابقة للويب بنسبة 100%) ============
const SeatsMapBase = ({
  reservedSeats = [],
  fixedSeats = [],
  bookingSeats = [],
  onSeatPress,
}: SeatsMapBaseProps) => {
  const statusOf = (n: number): SeatStatus => {
    const num = Number(n);
    if (fixedSeats.some((s) => Number(s) === num)) return "fixed";
    if (reservedSeats.some((s) => Number(s) === num)) return "reserved";
    if (bookingSeats.some((s) => Number(s) === num)) return "booking";
    return "available";
  };

  return (
    <View className="items-center p-4 gap-4 bg-white border border-[#e5e7eb] rounded-2xl">
      {/* العنوان والتفاصيل */}
      <View className="w-full items-end">
        <Text className="text-xs font-bold text-[#ea580c]">خريطة المقاعد</Text>
        <Text className="font-extrabold text-xl text-gray-900">
          اختر مقعدك المفضل
        </Text>
        <Text className="text-xs text-gray-400">
          بولمان سياحي فاخر (32 مقعداً)
        </Text>
      </View>

      {/* دليل الألوان (Legend) */}
      <View className="flex-row-reverse flex-wrap items-center justify-center gap-4 py-2 border-y border-gray-100 w-full">
        <View className="flex-row-reverse items-center gap-1.5">
          <View className="w-3.5 h-3.5 rounded border border-gray-300 bg-gray-50" />
          <Text className="text-xs text-gray-500 font-medium">متاح</Text>
        </View>

        <View className="flex-row-reverse items-center gap-1.5">
          <View className="w-3.5 h-3.5 rounded bg-[#ea580c]" />
          <Text className="text-xs text-gray-800 font-medium">محجوز (تطبيق)</Text>
        </View>

        <View className="flex-row-reverse items-center gap-1.5">
          <View className="w-3.5 h-3.5 rounded bg-[#1f2937]" />
          <Text className="text-xs text-gray-800 font-medium">مثبت (نقداً)</Text>
        </View>

        <View className="flex-row-reverse items-center gap-1.5">
          <View className="w-3.5 h-3.5 rounded bg-[#f59e0b] border border-[#d97706]" />
          <Text className="text-xs text-amber-700 font-bold">محدد للحجز</Text>
        </View>
      </View>

      {/* هيكل الباص الخارجي (مطابق لمجسم الويب) */}
      <View className="w-full max-w-[320px] bg-white border-2 border-orange-200/80 rounded-[40px] p-5 shadow-sm">
        {/* مقدمة الباص والسائق */}
        <View className="flex-row items-center justify-between pb-3 mb-4 border-b border-gray-100 px-2">
          <Text className="text-[11px] font-bold text-gray-400">مقدمة الباص</Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-[11px] font-semibold text-gray-400">السائق</Text>
            <View className="w-7 h-7 rounded-full border-2 border-gray-400 items-center justify-center">
              <Ionicons name="radio-button-on" size={14} color="#9ca3af" />
            </View>
          </View>
        </View>

        {/* شبكة المقاعد (8 صفوف × 4 مقاعد = 32 مقعداً) */}
        <View className="gap-3">
          {Array.from({ length: ROWS_COUNT }).map((_, rowIndex) => {
            const s1 = rowIndex * SEATS_PER_ROW + 1;
            const s2 = rowIndex * SEATS_PER_ROW + 2;
            const s3 = rowIndex * SEATS_PER_ROW + 3;
            const s4 = rowIndex * SEATS_PER_ROW + 4;

            return (
              <View
                key={rowIndex}
                className="flex-row items-center justify-between"
              >
                {/* مقاعد اليمين (1، 2) */}
                <View className="flex-row items-center gap-2">
                  <Seat
                    number={s1}
                    status={statusOf(s1)}
                    onPress={onSeatPress}
                  />
                  <Seat
                    number={s2}
                    status={statusOf(s2)}
                    onPress={onSeatPress}
                  />
                </View>

                {/* الممر الأوسط */}
                <View className="w-6 items-center justify-center">
                  <Text className="text-[9px] text-gray-300 font-bold">||</Text>
                </View>

                {/* مقاعد اليسار (3، 4) */}
                <View className="flex-row items-center gap-2">
                  <Seat
                    number={s3}
                    status={statusOf(s3)}
                    onPress={onSeatPress}
                  />
                  <Seat
                    number={s4}
                    status={statusOf(s4)}
                    onPress={onSeatPress}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* باب الصعود في نهاية الباص */}
        <View className="mt-5 pt-3 border-t border-gray-100 items-center justify-center">
          <View className="bg-gray-50 border border-gray-200 px-4 py-1 rounded-full">
            <Text className="text-[11px] font-bold text-gray-400">
              باب الصعود
            </Text>
          </View>
        </View>
      </View>

      <Text className="text-xs text-gray-400">
        إجمالي سعة البولمان: 32 مقعداً
      </Text>
    </View>
  );
};

export default SeatsMapBase;
