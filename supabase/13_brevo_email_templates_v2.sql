-- Atualiza templates de e-mail Feliora (visual editorial + itens em tabela)
-- Pode rodar mesmo se 12_brevo_fulfillment.sql já tiver sido executado.

insert into public.brevo_store_templates (event, name, subject, html_content, enabled, updated_at)
values
(
  'order_received',
  'Pedido criado → cliente',
  'Recebemos seu pedido #{{ORDER_SHORT_ID}}',
  $html$
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#F7F0E8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F0E8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FDF8F4;border:1px solid rgba(183,110,121,0.2);">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;border-bottom:1px solid rgba(183,110,121,0.15);">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.42em;text-transform:uppercase;color:#B76E79;">Feliora</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 36px;">
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8C7B6A;">Pedido recebido</p>
              <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;letter-spacing:0.04em;line-height:1.25;color:#2C241B;">Obrigada, {{CUSTOMER_NAME}}</h1>
              <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#6B5E52;">
                Recebemos o pedido <strong style="color:#2C241B;">#{{ORDER_SHORT_ID}}</strong>. Assim que o pagamento for confirmado, começamos o preparo com cuidado.
              </p>

              <p style="margin:28px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B76E79;">Suas peças</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(183,110,121,0.18);">
                {{ITEMS_HTML}}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-top:1px solid rgba(183,110,121,0.18);">
                <tr>
                  <td style="padding:10px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8C7B6A;">Subtotal</td>
                  <td style="padding:10px 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#2C241B;text-align:right;">{{SUBTOTAL}}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8C7B6A;">Frete</td>
                  <td style="padding:6px 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#2C241B;text-align:right;">{{SHIPPING_AMOUNT}}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#2C241B;">Total</td>
                  <td style="padding:12px 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#2C241B;text-align:right;">{{TOTAL}}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8C7B6A;">Pagamento: {{PAYMENT_METHOD}}</td>
                </tr>
              </table>

              <p style="margin:28px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B76E79;">Entrega</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.6;color:#6B5E52;">{{ADDRESS}}</p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#B76E79;">
                    <a href="{{ORDER_URL}}" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;color:#FDF8F4;">Ver meus pedidos</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid rgba(183,110,121,0.15);text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#8C7B6A;">Moda feminina com delicadeza · Feliora</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$html$,
  true,
  now()
),
(
  'order_received_merchant',
  'Pedido criado → loja',
  'Novo pedido #{{ORDER_SHORT_ID}} — {{TOTAL}}',
  $html$
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#F7F0E8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F0E8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FDF8F4;border:1px solid rgba(183,110,121,0.2);">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;border-bottom:1px solid rgba(183,110,121,0.15);">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.42em;text-transform:uppercase;color:#B76E79;">Feliora · Admin</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 36px;">
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8C7B6A;">Novo pedido</p>
              <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#2C241B;">#{{ORDER_SHORT_ID}}</h1>
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B5E52;">Cliente: <strong style="color:#2C241B;">{{CUSTOMER_NAME}}</strong></p>
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B5E52;">Total: <strong style="color:#2C241B;">{{TOTAL}}</strong></p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6B5E52;">Pagamento: {{PAYMENT_METHOD}} · {{PAYMENT_STATUS}}</p>

              <p style="margin:28px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B76E79;">Itens</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(183,110,121,0.18);">
                {{ITEMS_HTML}}
              </table>

              <p style="margin:28px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B76E79;">Endereço</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.6;color:#6B5E52;">{{ADDRESS}}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$html$,
  true,
  now()
),
(
  'payment_approved',
  'Pagamento aprovado → cliente',
  'Pagamento confirmado — #{{ORDER_SHORT_ID}}',
  $html$
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#F7F0E8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F0E8;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FDF8F4;border:1px solid rgba(183,110,121,0.2);">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;border-bottom:1px solid rgba(183,110,121,0.15);">
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:0.42em;text-transform:uppercase;color:#B76E79;">Feliora</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 36px;">
              <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#8C7B6A;">Pagamento confirmado</p>
              <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;letter-spacing:0.04em;line-height:1.25;color:#2C241B;">Tudo certo, {{CUSTOMER_NAME}}</h1>
              <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#6B5E52;">
                Confirmamos o pagamento do pedido <strong style="color:#2C241B;">#{{ORDER_SHORT_ID}}</strong> no valor de <strong style="color:#2C241B;">{{TOTAL}}</strong>. Já estamos preparando suas peças para o envio.
              </p>

              <p style="margin:28px 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#B76E79;">Resumo do pedido</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(183,110,121,0.18);">
                {{ITEMS_HTML}}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-top:1px solid rgba(183,110,121,0.18);">
                <tr>
                  <td style="padding:12px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#2C241B;">Total pago</td>
                  <td style="padding:12px 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#2C241B;text-align:right;">{{TOTAL}}</td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                <tr>
                  <td style="background:#B76E79;">
                    <a href="{{ORDER_URL}}" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;color:#FDF8F4;">Acompanhar pedido</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid rgba(183,110,121,0.15);text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#8C7B6A;">Moda feminina com delicadeza · Feliora</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
$html$,
  true,
  now()
)
on conflict (event) do update set
  name = excluded.name,
  subject = excluded.subject,
  html_content = excluded.html_content,
  enabled = excluded.enabled,
  updated_at = now();
