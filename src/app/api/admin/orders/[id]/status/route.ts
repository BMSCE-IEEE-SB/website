import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';
import { appendRegistrationToSheet } from '@/lib/server/google-sheets';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Order was not found.', 404);
  const body = await request.json().catch(() => null);
  if (!['verified', 'rejected'].includes(body?.status)) return jsonError('Choose a valid order status.');
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : null;
  try {
    const { error } = await getAdminServiceClient().rpc('set_order_status', {
      p_order_id: id,
      p_actor_id: admin.id,
      p_actor_email: admin.email,
      p_status: body.status,
      p_reason: reason,
    });
    if (error) return jsonError('The order could not be updated.', 409);

    if (body.status === 'verified') {
      const client = getAdminServiceClient();
      const { data: orderData, error: orderError } = await client
        .from('orders')
        .select(`
          order_reference,
          total_amount,
          tshirt_size,
          program,
          profiles(first_name, last_name, usn, email, phone, department, year_of_study),
          order_items(chapters(name))
        `)
        .eq('id', id)
        .single();
      
      if (!orderError && orderData && orderData.profiles) {
        const profile = orderData.profiles as any;
        const items = (orderData.order_items as any[]) || [];
        const chapters = items
          .map((i) => i.chapters?.name)
          .filter(Boolean)
          .join(', ');

        // Await to ensure the sync finishes before the serverless function exits
        await appendRegistrationToSheet({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          email: profile.email,
          phone: profile.phone,
          usn: profile.usn,
          department: profile.department,
          year: profile.year_of_study,
          orderReference: orderData.order_reference,
          amount: Number(orderData.total_amount),
          tshirtSize: orderData.tshirt_size,
          program: orderData.program,
          chapters,
        });
      }
    }

    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('The order could not be updated.', 503);
  }
}
