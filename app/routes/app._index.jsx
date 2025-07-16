import { useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";



export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      <TitleBar title="Dista App" />
      <div style={{ position: 'relative', width: '100%', maxWidth: 800, margin: '40px auto 0 auto' }}>
        <Card padding="800" background="bg-surface" borderRadius="400" style={{ width: '100%' }}>
          <BlockStack gap="400" align="center">
            <InlineStack gap="400" align="center" blockAlign="center">
              <img
                src="/dista_logo.png"
                alt="Dista Logo"
                style={{ width: 90, height: 90, display: 'block', verticalAlign: 'middle' }}
              />
              <Text as="h1" variant="heading2xl" fontWeight="bold" alignment="center" style={{ margin: 0, lineHeight: '90px', display: 'flex', alignItems: 'center' }}>
                Dista App
              </Text>
            </InlineStack>
            <Text variant="bodyLg" as="p" color="subdued" alignment="center">
              This app is required for safe and secure collaboration with the Distacart organisation.<br />
              <span>
                Please do not uninstall this app.
              </span>
            </Text>
          </BlockStack>
        </Card>
        <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', textAlign: 'right' }}>
          <Text variant="bodySm" color="subdued" style={{ marginTop: 8 }}>
            Powered by Distacart
          </Text>
        </div>
      </div>
    </Page>
  );
}
