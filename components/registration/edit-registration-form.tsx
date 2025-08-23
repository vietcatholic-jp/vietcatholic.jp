"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Users, Save, X } from "lucide-react";
import { 
  GENDERS, 
  AGE_GROUPS,
  EventParticipationRole,
  JAPANESE_PROVINCES,
  PROVINCE_DIOCESE_MAPPING,
  Registration,
  GenderType,
  AgeGroupType,
  SHIRT_SIZES_PARTICIPANT,
  SHIRT_SIZES_ORGANIZER,
  EventConfig
} from "@/lib/types";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const RegistrantSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  saint_name: z.string().optional(),
  full_name: z.string().min(1, "Họ và tên là bắt buộc"),
  gender: z.enum(['male', 'female', 'other'] as const, {
    required_error: "Vui lòng chọn giới tính"
  }),
  age_group: z.enum(['under_12', '12_17', '18_25', '26_35', '36_50', 'over_50'] as const, {
    required_error: "Vui lòng chọn độ tuổi"
  }),
  province: z.string().optional(),
  diocese: z.string().optional(),
  address: z.string().optional(),
  facebook_link: z.string().optional().or(z.literal("")),
  phone: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    return val.length >= 10 && /^\+?[0-9\s\-\(\)]+$/.test(val);
  }, "Số điện thoại không hợp lệ"),
  shirt_size: z.enum(['1','2','3','4','5','XS','S','M','L','XL','XXL','3XL','4XL','M-XS', 'M-S', 'M-M', 'M-L', 'M-XL', 'M-XXL', 'M-3XL', 'M-4XL', 'F-XS', 'F-S', 'F-M', 'F-L', 'F-XL', 'F-XXL'] as const, {
    required_error: "Vui lòng chọn size áo"
  }),
  event_role: z.string() as z.ZodType<EventParticipationRole>,
  go_with: z.boolean().optional(),
  second_day_only: z.boolean().optional(),
  selected_attendance_day: z.string().optional(),
  is_primary: z.boolean(),
  notes: z.string().optional(),
});

const FormSchema = z.object({
  registrants: z.array(RegistrantSchema).min(1, "Phải có ít nhất 1 người tham gia"),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validate required fields for primary registrant
  data.registrants.forEach((registrant, index) => {
    if (registrant.is_primary) {
      // For primary registrant, Facebook link is required
      if (!registrant.facebook_link || registrant.facebook_link.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Link Facebook là bắt buộc cho người đăng ký chính",
          path: ["registrants", index, "facebook_link"],
        });
      } else {
        // Validate URL format for primary registrant
        try {
          new URL(registrant.facebook_link);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Link Facebook không hợp lệ",
            path: ["registrants", index, "facebook_link"],
          });
        }
      }
      
      // Province is required for primary registrant
      if (!registrant.province || registrant.province.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tỉnh/Phủ là bắt buộc cho người đăng ký chính",
          path: ["registrants", index, "province"],
        });
      }
      
      // Diocese is required for primary registrant
      if (!registrant.diocese || registrant.diocese.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Giáo phận là bắt buộc cho người đăng ký chính",
          path: ["registrants", index, "diocese"],
        });
      }
    } else {
      // For non-primary registrants, if provided, must be valid URL
      if (registrant.facebook_link && registrant.facebook_link.trim() !== "") {
        try {
          new URL(registrant.facebook_link);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Link Facebook không hợp lệ",
            path: ["registrants", index, "facebook_link"],
          });
        }
      }
    }
  });
});

type FormData = z.infer<typeof FormSchema>;

interface EditRegistrationFormProps {
  registration: Registration;
  onSave: () => void;
  onCancel: () => void;
}

export function EditRegistrationForm({ registration, onSave, onCancel }: EditRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);
  const supabase = createClient();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      registrants: registration.registrants?.map(r => ({
        id: r.id,
        email: r.email || "",
        saint_name: r.saint_name || "",
        full_name: r.full_name,
        gender: r.gender,
        age_group: r.age_group,
        province: r.province || "",
        diocese: r.diocese || "",
        address: r.address || "",
        facebook_link: r.facebook_link || "",
        phone: r.phone || "",
        shirt_size: r.shirt_size,
        event_role: r.event_role || "participant",
        is_primary: r.is_primary || false,
        go_with: r.go_with || false,
        second_day_only: r.second_day_only || false,
        selected_attendance_day: r.selected_attendance_day || "",
        notes: r.notes || "",
      })) || [],
      notes: registration.notes || "",
    },
  });

  // Fetch active event config and roles
    useEffect(() => {
      const fetchEventData = async () => {
        //setIsLoadingRoles(true);
        try {
          // Fetch event config
          const { data: eventData, error: eventError } = await supabase.from('event_configs')
          .select('*')
          .eq('id', registration.event_config_id)
          .single();

          if (eventError) {
            console.error('Error fetching event config:', eventError);
          } else {
            setEventConfig(eventData || null);
          }
        } catch (error) {
          console.error('Failed to fetch event data:', error);
        } finally {
         // setIsLoadingRoles(false);
        }
      };
  
      fetchEventData();
    }, [supabase, registration]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "registrants",
  });

  const registrants = watch("registrants");

  const handleProvinceChange = (index: number, selectedProvince: string) => {
    setValue(`registrants.${index}.province` as const, selectedProvince);
    if (selectedProvince && PROVINCE_DIOCESE_MAPPING[selectedProvince]) {
      setValue(`registrants.${index}.diocese` as const, PROVINCE_DIOCESE_MAPPING[selectedProvince]);
    }
  };

  const handleGenderChange = (index: number, selectedGender: string) => {
      setValue(`registrants.${index}.gender` as const, selectedGender as GenderType);
      if(registrants[index].event_role === '') {
        setValue(`registrants.${index}.shirt_size` as const, "M" as const);
      }else{
        if (selectedGender === "female") {
          setValue(`registrants.${index}.shirt_size` as const, "F-M" as const);
        }
        if (selectedGender === "male") {
          setValue(`registrants.${index}.shirt_size` as const, "M-M" as const);
        }
      }
  };

  const handleAgeGroupChange = (index: number, selectedAgeGroup: string) => {
        setValue(`registrants.${index}.age_group` as const, selectedAgeGroup as AgeGroupType);
        // Automatically adjust shirt size based on age group
        if (selectedAgeGroup === 'under_12') {
          setValue(`registrants.${index}.shirt_size` as const, "2" as const); // Default to smallest size for under 12
        }
    };

  const addRegistrant = () => {
    append({
      saint_name: "",
      full_name: "",
      gender: "male" as const,
      age_group: "26_35" as const,
      province: "",
      diocese: "",
      address: "",
      facebook_link: "",
      phone: "",
      email: "",
      shirt_size: "F-M" as const,
      event_role: "participant",
      is_primary: false,
      go_with: false,
      second_day_only: false,
      selected_attendance_day: "",
      notes: "",
    });
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const primary = data.registrants[0];
    if (!primary.province || primary.province.trim() === "") {
      toast.error("Người đăng ký chính phải chọn Tỉnh/Phủ.");
      setIsSubmitting(false);
      return;
    }
    if (!primary.facebook_link || primary.facebook_link.trim() === "") {
      toast.error("Người đăng ký chính phải nhập Link Facebook.");
      setIsSubmitting(false);
      return;
    }

    if (registration.status === 'confirmed' || registration.status === 'report_paid' || registration.status === 'confirm_paid') {
      if (data.registrants.length > registration.participant_count) {
        toast.error("Không thể thêm người tham gia mới khi đăng ký đã được xác nhận hoặc đã đóng phí. Số người đã đóng phí đã đăng ký: " + registration.participant_count);
        setIsSubmitting(false);
        return;
      }
      if (data.registrants.length < registration.participant_count) {
        toast.error("Không thể giảm số người tham gia khi đăng ký đã được xác nhận hoặc đã đóng phí. Số người đã đóng phí đã đăng ký: " + registration.participant_count);
        setIsSubmitting(false);
        return;
      }
    }
    
    try {
      const response = await fetch(`/api/registrations/${registration.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrants: data.registrants.map(registrant => ({
            ...registrant,
            saint_name: registrant.saint_name?.toUpperCase() || "",
            full_name: registrant.full_name.toUpperCase(),
            email: registrant.is_primary ? registrant.email : data.registrants[0].email,
            phone: registrant.is_primary ? registrant.phone : data.registrants[0].phone,
            address: registrant.is_primary ? registrant.address : data.registrants[0].address,
            province: registrant.is_primary ? registrant.province : data.registrants[0].province,
            diocese: registrant.is_primary ? registrant.diocese : data.registrants[0].diocese,
          })),
          notes: data.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Update failed');
      }

      toast.success("Cập nhật đăng ký thành công!");
      onSave();
      
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra trong quá trình cập nhật.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAttendanceDayChange = (index: number, selectedDay: string) => {
    setValue(`registrants.${index}.selected_attendance_day` as const, selectedDay);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Chỉnh sửa đăng ký</h2>
            <p className="text-muted-foreground">
              Mã đăng ký: <span className="font-medium">#{registration.invoice_code}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Registrants */}
        <Card className="border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Thông tin đăng ký ({registration.participant_count > registrants.length ? `${registration.participant_count} người` : `${registrants.length} người`})
              </CardTitle>
              {((registration.status === 'pending') || (registration.participant_count > registrants.length)) && (
                  <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRegistrant}
                  className="hidden sm:flex bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-600 text-blue-600 hover:from-blue-100 hover:to-purple-100 hover:border-blue-700 transform hover:scale-105 transition-all shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm người
                </Button>
              )}
            </div>
            {/* Mobile add button */}
            {((registration.status === 'pending') || (registration.participant_count > registrants.length)) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRegistrant}
              className="sm:hidden w-full mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-600 text-blue-600 hover:from-blue-100 hover:to-purple-100 hover:border-blue-700 shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm người
            </Button>)}

          </CardHeader>
          <CardContent className="space-y-8">
            {fields.map((field, index) => {
              const isPrimary = registrants[index]?.is_primary;
              
              return (
                <div key={field.id} id={`registrant-${index}`} className="border border-gray-600 rounded-lg p-4 sm:p-6 relative">
                  {registrants.length > 1 && !isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm sm:text-base">
                      {isPrimary ? `Người đăng ký chính` : `Người tham gia ${index + 1}`}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.saint_name`}>Tên Thánh</Label>
                      <Input
                        id={`registrants.${index}.saint_name`}
                        {...register(`registrants.${index}.saint_name`)}
                        placeholder="Tên thánh bảo trợ"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.full_name`}>Họ và Tên *</Label>
                      <Input
                        id={`registrants.${index}.full_name`}
                        {...register(`registrants.${index}.full_name`)}
                        placeholder="Nguyễn Văn A"
                      />
                      {errors.registrants?.[index]?.full_name && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.full_name?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.gender`}>Giới tính *</Label>
                      <select
                        id={`registrants.${index}.gender`}
                        {...register(`registrants.${index}.gender`)}
                        onChange={(e) => handleGenderChange(index, e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn giới tính</option>
                        {GENDERS.map((gender) => (
                          <option key={gender.value} value={gender.value}>
                            {gender.label}
                          </option>
                        ))}
                      </select>
                      {errors.registrants?.[index]?.gender && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.gender?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.age_group`}>Độ tuổi *</Label>
                      <select
                        id={`registrants.${index}.age_group`}
                        {...register(`registrants.${index}.age_group`)}
                        onChange={(e) => handleAgeGroupChange(index, e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn độ tuổi</option>
                        {AGE_GROUPS.map((age) => (
                          <option key={age.value} value={age.value}>
                            {age.label}
                          </option>
                        ))}
                      </select>
                      {errors.registrants?.[index]?.age_group && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.age_group?.message}
                        </p>
                      )}
                    </div>

                    {/* Primary registrant gets full form */}
                    {isPrimary && (
                      <>

                        <div className="space-y-2">
                          <Label htmlFor={`registrants.${index}.province`}>Tỉnh/Phủ *</Label>
                          <select
                            id={`registrants.${index}.province`}
                            {...register(`registrants.${index}.province`)}
                            onChange={(e) => handleProvinceChange(index, e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Chọn tỉnh/phủ</option>
                            {JAPANESE_PROVINCES.map((province) => (
                              <option key={province.value} value={province.value}>
                                {province.label}
                              </option>
                            ))}
                          </select>
                          {errors.registrants?.[index]?.province && (
                            <p className="text-sm text-destructive">
                              {errors.registrants[index]?.province?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`registrants.${index}.diocese`}>Giáo phận *</Label>
                          <Input
                            id={`registrants.${index}.diocese`}
                            {...register(`registrants.${index}.diocese`)}
                            placeholder="Tự động điền khi chọn tỉnh"
                            readOnly
                            className="bg-muted"
                          />
                          {errors.registrants?.[index]?.diocese && (
                            <p className="text-sm text-destructive">
                              {errors.registrants[index]?.diocese?.message}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Common fields for all registrants */}
                    

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.shirt_size`}>Size áo *</Label>
                      <select
                        id={`registrants.${index}.shirt_size`}
                        {...register(`registrants.${index}.shirt_size`)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Chọn size</option>
                        {
                        (registrants[index]?.event_role === "participant" ) ? (
                          SHIRT_SIZES_PARTICIPANT.map((size) => (
                            <option key={size.value} value={size.value}>
                              {size.label}
                            </option>
                          ))
                        ) : (
                          SHIRT_SIZES_ORGANIZER.map((size) => (
                            <option key={size.value} value={size.value}>
                              {size.label}
                            </option>
                          ))
                        )}
                      </select>
                      <p className="text-xs text-muted-foreground">
                          {registrants[index]?.event_role === "participant" ? "Chọn size áo không phân biệt giới tính.": "Chọn size áo theo cân nặng và giới tính."}
                      </p>
                      {errors.registrants?.[index]?.shirt_size && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.shirt_size?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.facebook_link`}>
                        Link Facebook {isPrimary ? "*" : ""}
                      </Label>
                      <Input
                        id={`registrants.${index}.facebook_link`}
                        {...register(`registrants.${index}.facebook_link`)}
                        placeholder="https://facebook.com/username"
                      />
                      {errors.registrants?.[index]?.facebook_link && (
                        <p className="text-sm text-destructive">
                          {errors.registrants[index]?.facebook_link?.message}
                        </p>
                      )}
                      {isPrimary && (
                        <div className="text-xs text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                          Link facebook được lấy ở phần cài đặt trong trang cá nhân → 
                          Bấm vào dấu ... bên cạnh nút chỉnh sửa trang cá nhân → Kéo xuống phía dưới cùng, bạn sẽ thấy chữ copy link, bấm vào đó để sao chép → dán vào đây.
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`registrants.${index}.second_day_only`}>Tùy chọn tham gia</Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`registrants.${index}.second_day_only`}
                          checked={registrants[index]?.second_day_only || false}
                          onChange={(e) => {
                            setValue(`registrants.${index}.second_day_only`, e.target.checked);
                            if (!e.target.checked) {
                              setValue(`registrants.${index}.selected_attendance_day`, "");
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`registrants.${index}.second_day_only`} className="text-sm font-normal">
                          Chỉ tham gia một ngày
                        </Label>
                      </div>
                      
                      {/* Day selection when one day only is checked */}
                      {registrants[index]?.second_day_only && eventConfig?.start_date && eventConfig?.end_date && (
                        <div className="mt-3 ml-6 space-y-2">
                          <Label className="text-sm font-medium">Chọn ngày tham gia:</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`registrants.${index}.first_day`}
                                name={`registrants.${index}.attendance_day`}
                                value={eventConfig.start_date}
                                checked={registrants[index]?.selected_attendance_day === eventConfig.start_date}
                                onChange={(e) => onAttendanceDayChange(index, e.target.value)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <Label htmlFor={`registrants.${index}.first_day`} className="text-sm font-normal">
                                Ngày đầu: {new Date(eventConfig.start_date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id={`registrants.${index}.second_day`}
                                name={`registrants.${index}.attendance_day`}
                                value={eventConfig.end_date}
                                checked={registrants[index]?.selected_attendance_day === eventConfig.end_date}
                                onChange={(e) => onAttendanceDayChange(index, e.target.value)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <Label htmlFor={`registrants.${index}.second_day`} className="text-sm font-normal">
                                Ngày cuối: {new Date(eventConfig.end_date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Nếu bạn chỉ có thể tham gia một ngày, chọn tùy chọn này sẽ đóng 50% giá tiền.
                        Trẻ em dưới 12 tuổi: 25% giá tiền.
                      </p>
                    </div>

                    <div className="space-y-2 mt-2">
                      <Label htmlFor={`registrants.${index}.go_with`}>Bạn có nhu cầu đi xe chung không?</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="checkbox"
                          id={`registrants.${index}.go_with`}
                          {...register(`registrants.${index}.go_with`)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor={`registrants.${index}.go_with`} className="text-sm font-normal">
                          Tôi muốn đi chung với nhóm
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Lưu ý: Nếu bạn muốn đi chung với nhóm hoặc cộng đoàn ở gần bạn, hãy chọn ô này.
                        Thông tin về các nhóm hoặc cộng đoàn có tổ chức xe chung sẽ được cập nhật sau,
                        vui lòng theo dõi trang web hoặc nhóm Facebook của sự kiện để biết thêm chi tiết.
                      </p>
                    </div>

                    {/* Optional contact information section */}
                    <div className="md:col-span-2 border-t border-gray-800 pt-4 mt-6">
                      <h5 className="font-medium mb-3">
                        Phần thông tin không bắt buộc (tùy chọn)
                      </h5>
                      {isPrimary && (
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`registrants.${index}.email`}>Email</Label>
                            <Input
                              id={`registrants.${index}.email`}
                              {...register(`registrants.${index}.email`)}
                              placeholder="example@email.com"
                            />
                            {errors.registrants?.[index]?.email && (
                              <p className="text-sm text-destructive">
                                {errors.registrants[index]?.email?.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Nếu bạn không có facebook hoặc không muốn cung cấp, hãy nhập email để ban tổ chức có thể liên hệ với bạn.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`registrants.${index}.phone`}>Số điện thoại</Label>
                            <Input
                              id={`registrants.${index}.phone`}
                              {...register(`registrants.${index}.phone`)}
                              placeholder="090-1234-5678"
                            />
                            {errors.registrants?.[index]?.phone && (
                              <p className="text-sm text-destructive">
                                {errors.registrants[index]?.phone?.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Ít nhất 10 số, có thể bao gồm +, dấu cách, dấu gạch ngang
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`registrants.${index}.address`}>Địa chỉ</Label>
                            <Input
                              id={`registrants.${index}.address`}
                              {...register(`registrants.${index}.address`)}
                              placeholder="Địa chỉ hiện tại tại Nhật Bản"
                            />
                            {errors.registrants?.[index]?.address && (
                              <p className="text-sm text-destructive">
                                {errors.registrants[index]?.address?.message}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 md:col-span-2 mt-2">
                        <Label htmlFor={`registrants.${index}.notes`}>Ý kiến/Nguyện vọng</Label>
                        <Textarea
                          id={`registrants.${index}.notes`}
                          {...register(`registrants.${index}.notes`)}
                          placeholder="Ý kiến đóng góp hoặc Nguyện vọng chia đội"
                          className="min-h-[80px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          Nếu bạn muốn được chia đội cùng với bạn bè, xin hãy ghi rõ tên của họ ở đây.
                          Nếu bạn có yêu cầu đặc biệt nào khác, hãy ghi chú để ban tổ chức có thể hỗ trợ bạn tốt nhất.
                        </p>
                      </div>
                    </div>

                    {/* Hidden fields */}
                    <input type="hidden" {...register(`registrants.${index}.is_primary`)} />
                    {registrants[index]?.id && (
                      <input type="hidden" {...register(`registrants.${index}.id`)} />
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Final add button at the bottom */}
            {((registration.status === 'pending') || (registration.participant_count > registrants.length))&& (
            <div className="flex justify-center pt-4 border-t border-dashed">
              <Button
                type="button"
                variant="outline"
                onClick={addRegistrant}
                className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm người tham gia
              </Button>
            </div>
            )}
          </CardContent>
        </Card>

        {/* General Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú chung</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register("notes")}
              placeholder="Ghi chú chung cho toàn bộ đăng ký (nếu có)"
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-center">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            className="min-w-[200px]"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
