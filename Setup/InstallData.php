<?php

namespace Fastly\Cdn\Setup;

use Magento\Framework\Setup\InstallDataInterface;
use Magento\Framework\Setup\ModuleContextInterface;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Fastly\Cdn\Model\Statistic;

class InstallData implements InstallDataInterface
{
    /**
     * Date model
     *
     * @var \Magento\Framework\Stdlib\DateTime\DateTime
     */
    protected $_date;

    /**
     * @var \Magento\Framework\App\Config\ScopeConfigInterface
     */
    protected $_scopeConfig;

    /**
     * @var \Magento\Framework\App\Config\Storage\WriterInterface
     */
    protected $_configWriter;

    /**
     * @var Statistic
     */
    protected $_statistic;

    /**
     * InstallData constructor.
     * @param \Magento\Framework\Stdlib\DateTime\DateTime $date
     */
    public function __construct(
        \Magento\Framework\Stdlib\DateTime\DateTime $date,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Framework\App\Config\Storage\WriterInterface $configWriter,
        Statistic $statistic
    )
    {
        $this->_date = $date;
        $this->_scopeConfig = $scopeConfig;
        $this->_configWriter = $configWriter;
        $this->_statistic = $statistic;
    }

    /**
     * @param ModuleDataSetupInterface $setup
     * @param ModuleContextInterface $context
     */
    public function install(ModuleDataSetupInterface $setup, ModuleContextInterface $context)
    {
        $setup->startSetup();
        $tableName = $setup->getTable('fastly_statistics');
        if($setup->getConnection()->isTableExists($tableName) == true) {

            $data = [
                'action' => Statistic::FASTLY_INSTALLED_FLAG,
                'created_at' => $this->_date->date()
            ];

            $setup->getConnection()->insert($tableName, $data);
        }
        // Generate GA cid and store it for further use
        $this->_configWriter->save('system/full_page_cache/fastly/fastly_ga_cid', $this->_statistic->generateCid());
        $setup->endSetup();
    }
}